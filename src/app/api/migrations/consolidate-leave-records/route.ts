import "server-only";
import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { titleCaseName } from "@/lib/text";

export const dynamic = "force-dynamic";

type SourceTable = "annual_leave_record" | "mc_record";

interface Mismatch {
  sourceTable: SourceTable;
  sourceId: number;
  name: string | null;
  reason: string;
}

interface DuplicateEntry {
  sourceTable: SourceTable;
  sourceId: number;
  name: string | null;
  start_date: string;
  leave_type: "AL" | "SL";
  existingLeaveId: number;
}

interface ErrorEntry {
  sourceTable: SourceTable;
  sourceId: number;
  error: string;
}

interface ResponseShape {
  success: boolean;
  dryRun: boolean;
  summary: {
    totalSourceRecords: {
      annualLeaveRecord: number;
      mcRecord: number;
      total: number;
    };
    inserted: number;
    skipped: number;
    errors: number;
    duration_ms: number;
  };
  inserted_by_table: {
    annual_leave_record: number;
    mc_record: number;
  };
  mismatches: Mismatch[];
  duplicates: DuplicateEntry[];
  errors: ErrorEntry[];
  details: {
    status_distribution: Record<string, number>;
    by_leave_type: Record<string, number>;
  };
}

function snapToDateOnly(value: Date): Date {
  // Snap any timestamp to UTC midnight for the same MYT calendar day. The
  // ebrightleads sync already stores these as UTC-midnight Date objects, so
  // this is essentially a defensive normalization.
  const shifted = new Date(value.getTime() + 8 * 60 * 60 * 1000);
  shifted.setUTCHours(0, 0, 0, 0);
  // Reverse the +8h shift to land back on the same UTC midnight that the
  // sync writes — keeping comparisons exact for duplicate detection.
  return new Date(shifted.getTime() - 8 * 60 * 60 * 1000);
}

function parseDuration(raw: string | null): number {
  if (!raw) return 1;
  const match = raw.match(/[\d]+(?:\.[\d]+)?/);
  if (!match) return 1;
  const n = parseFloat(match[0]);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

async function runMigration(dryRun: boolean): Promise<ResponseShape> {
  const startedAt = Date.now();
  const mismatches: Mismatch[] = [];
  const duplicates: DuplicateEntry[] = [];
  const errors: ErrorEntry[] = [];
  const statusDist: Record<string, number> = {};
  const byLeaveType: Record<string, number> = {};
  let inserted = 0;
  let skipped = 0;
  let insertedAL = 0;
  let insertedSL = 0;

  // Resolve leave type ids by code (don't trust hardcoded 1/5).
  const leaveTypeRows = await prisma.leave_types.findMany({
    where: { leave_type_code: { in: ["AL", "SL"] } },
    select: { leave_type_id: true, leave_type_code: true },
  });
  const leaveTypeByCode = new Map<string, number>();
  for (const lt of leaveTypeRows) {
    leaveTypeByCode.set(lt.leave_type_code.toUpperCase(), lt.leave_type_id);
  }
  const alId = leaveTypeByCode.get("AL");
  const slId = leaveTypeByCode.get("SL");
  if (!alId || !slId) {
    throw new Error(
      `Missing required leave_types rows: AL=${alId ?? "?"} SL=${slId ?? "?"}. Seed leave_types first.`,
    );
  }

  // Pre-load users-with-profile into a normalized name → user_id map.
  const userRows = await prisma.users.findMany({
    where: { user_profile: { isNot: null } },
    select: {
      user_id: true,
      user_profile: { select: { full_name: true } },
    },
  });
  const userByName = new Map<string, number>();
  for (const u of userRows) {
    const raw = u.user_profile?.full_name;
    if (!raw) continue;
    const key = titleCaseName(raw).toLowerCase();
    if (key && !userByName.has(key)) {
      userByName.set(key, u.user_id);
    }
  }

  function lookupUserId(name: string | null): number | undefined {
    if (!name) return undefined;
    const key = titleCaseName(name).toLowerCase();
    return key ? userByName.get(key) : undefined;
  }

  // Fetch source rows.
  const [alRows, mcRows] = await Promise.all([
    prisma.annual_leave_record.findMany({
      orderBy: { al_date: "desc" },
    }),
    prisma.mc_record.findMany({
      orderBy: { mc_date: "desc" },
    }),
  ]);

  // -------------------- Annual Leave --------------------
  for (const row of alRows) {
    const userId = lookupUserId(row.name);
    if (!userId) {
      errors.push({
        sourceTable: "annual_leave_record",
        sourceId: row.source_id,
        error: `Employee '${row.name}' not found in hrfs.users`,
      });
      mismatches.push({
        sourceTable: "annual_leave_record",
        sourceId: row.source_id,
        name: row.name,
        reason: `Employee '${row.name}' not found in hrfs.users`,
      });
      continue;
    }

    const startDate = snapToDateOnly(row.al_date);
    const days = parseDuration(row.al_duration);
    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + Math.max(0, Math.ceil(days) - 1));

    const existing = await prisma.leave_request.findFirst({
      where: { user_id: userId, leave_type_id: alId, start_date: startDate },
      select: { leave_id: true },
    });
    if (existing) {
      skipped++;
      duplicates.push({
        sourceTable: "annual_leave_record",
        sourceId: row.source_id,
        name: row.name,
        start_date: startDate.toISOString().slice(0, 10),
        leave_type: "AL",
        existingLeaveId: existing.leave_id,
      });
      continue;
    }

    if (dryRun) {
      inserted++;
      insertedAL++;
      statusDist["approved"] = (statusDist["approved"] ?? 0) + 1;
      byLeaveType["AL"] = (byLeaveType["AL"] ?? 0) + 1;
      continue;
    }

    try {
      await prisma.leave_request.create({
        data: {
          user_id: userId,
          leave_type_id: alId,
          start_date: startDate,
          end_date: endDate,
          total_days: new Prisma.Decimal(days),
          reason: null,
          status: "approved",
          applied_at: row.al_date,
        },
      });
      inserted++;
      insertedAL++;
      statusDist["approved"] = (statusDist["approved"] ?? 0) + 1;
      byLeaveType["AL"] = (byLeaveType["AL"] ?? 0) + 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push({
        sourceTable: "annual_leave_record",
        sourceId: row.source_id,
        error: msg,
      });
    }
  }

  // -------------------- Medical Certificate --------------------
  for (const row of mcRows) {
    const userId = lookupUserId(row.name);
    if (!userId) {
      errors.push({
        sourceTable: "mc_record",
        sourceId: row.source_id,
        error: `Employee '${row.name}' not found in hrfs.users`,
      });
      mismatches.push({
        sourceTable: "mc_record",
        sourceId: row.source_id,
        name: row.name,
        reason: `Employee '${row.name}' not found in hrfs.users`,
      });
      continue;
    }

    const startDate = snapToDateOnly(row.mc_date);
    // mc_record has no duration column — single-day MC is the assumed default.
    const days = 1;
    const endDate = startDate;

    const existing = await prisma.leave_request.findFirst({
      where: { user_id: userId, leave_type_id: slId, start_date: startDate },
      select: { leave_id: true },
    });
    if (existing) {
      skipped++;
      duplicates.push({
        sourceTable: "mc_record",
        sourceId: row.source_id,
        name: row.name,
        start_date: startDate.toISOString().slice(0, 10),
        leave_type: "SL",
        existingLeaveId: existing.leave_id,
      });
      continue;
    }

    if (dryRun) {
      inserted++;
      insertedSL++;
      statusDist["approved"] = (statusDist["approved"] ?? 0) + 1;
      byLeaveType["SL"] = (byLeaveType["SL"] ?? 0) + 1;
      continue;
    }

    try {
      await prisma.leave_request.create({
        data: {
          user_id: userId,
          leave_type_id: slId,
          start_date: startDate,
          end_date: endDate,
          total_days: new Prisma.Decimal(days),
          reason: row.reason ?? null,
          status: "approved",
          applied_at: row.mc_date,
        },
      });
      inserted++;
      insertedSL++;
      statusDist["approved"] = (statusDist["approved"] ?? 0) + 1;
      byLeaveType["SL"] = (byLeaveType["SL"] ?? 0) + 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push({
        sourceTable: "mc_record",
        sourceId: row.source_id,
        error: msg,
      });
    }
  }

  return {
    success: errors.length === 0,
    dryRun,
    summary: {
      totalSourceRecords: {
        annualLeaveRecord: alRows.length,
        mcRecord: mcRows.length,
        total: alRows.length + mcRows.length,
      },
      inserted,
      skipped,
      errors: errors.length,
      duration_ms: Date.now() - startedAt,
    },
    inserted_by_table: {
      annual_leave_record: insertedAL,
      mc_record: insertedSL,
    },
    mismatches,
    duplicates,
    errors,
    details: {
      status_distribution: statusDist,
      by_leave_type: byLeaveType,
    },
  };
}

export async function POST(request: NextRequest): Promise<Response> {
  const dryRun = request.nextUrl.searchParams.get("dryRun") === "true";
  console.info(
    `[consolidate-leave] starting (dryRun=${dryRun}) at ${new Date().toISOString()}`,
  );
  try {
    const result = await runMigration(dryRun);
    console.info(
      `[consolidate-leave] done. inserted=${result.summary.inserted} skipped=${result.summary.skipped} errors=${result.summary.errors} dur=${result.summary.duration_ms}ms`,
    );
    return Response.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[consolidate-leave] fatal:", msg);
    return Response.json(
      { success: false, dryRun, error: msg },
      { status: 500 },
    );
  }
}
