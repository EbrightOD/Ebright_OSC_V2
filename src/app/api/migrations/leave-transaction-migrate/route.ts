import "server-only";
import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { queryEbrightHrfs } from "@/lib/ebright-hrfs";
import { titleCaseName } from "@/lib/text";

export const dynamic = "force-dynamic";

const STATUS_MAP: Record<string, string> = {
  A: "approved",
  N: "pending",
  R: "rejected",
  C: "cancelled",
};

interface SourceRow {
  id: number;
  EmployeeCode: string | null;
  LeaveTypeCode: string | null;
  LeaveTransId: string | null;
  ApplyDate: Date | string | null;
  ApplyReason: string | null;
  ApplyStatus: string | null;
  Attachment: string | null;
  LeaveDate: Date | string | null;
  Days: number | string | null;
  EmployeeName: string | null;
}

interface Mismatch {
  sourceId: number;
  employeeName: string | null;
  leaveTypeCode: string | null;
  reason: string;
}

interface Summary {
  totalSourceRecords: number;
  filteredByDate: number;
  inserted: number;
  skipped: number;
  errors: number;
  duration_ms: number;
}

interface ResponseShape {
  success: boolean;
  dryRun: boolean;
  summary: Summary;
  mismatches: Mismatch[];
  details: {
    startDate: string;
    endDate: string;
    statusCounts: Record<string, number>;
  };
}

function toDateOnly(value: Date | string | null): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  // Snap to UTC midnight so it lands on the correct calendar day in `date` columns.
  const shifted = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  shifted.setUTCHours(0, 0, 0, 0);
  return shifted;
}

function addDays(date: Date, days: number): Date {
  const out = new Date(date);
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}

function toNumber(value: number | string | null): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

async function runMigration(dryRun: boolean): Promise<ResponseShape> {
  const startedAt = Date.now();
  const mismatches: Mismatch[] = [];
  const statusCounts: Record<string, number> = {};
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  // 1) Fetch source rows (last 6 months by LeaveDate).
  const sourceResult = await queryEbrightHrfs<SourceRow>(
    `SELECT id,
            "EmployeeCode",
            "LeaveTypeCode",
            "LeaveTransId",
            "ApplyDate",
            "ApplyReason",
            "ApplyStatus",
            "Attachment",
            "LeaveDate",
            "Days",
            "EmployeeName"
       FROM public."LeaveTransaction"
      WHERE "LeaveDate" >= NOW() - INTERVAL '6 months'
      ORDER BY "LeaveDate" DESC`,
  );

  // Total source records is the date-filtered set we just pulled. We also
  // need a true total for the summary so users can see how much was excluded.
  const totalsResult = await queryEbrightHrfs<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM public."LeaveTransaction"`,
  );
  const totalSourceRecords = parseInt(totalsResult.rows[0]?.count ?? "0", 10);
  const filteredByDate = sourceResult.rowCount ?? sourceResult.rows.length;

  // 2) Pre-load all leave_types into a code → id map.
  const leaveTypeRows = await prisma.leave_types.findMany({
    select: { leave_type_id: true, leave_type_code: true },
  });
  const leaveTypeByCode = new Map<string, number>();
  for (const lt of leaveTypeRows) {
    leaveTypeByCode.set(lt.leave_type_code.toUpperCase(), lt.leave_type_id);
  }

  // 3) Pre-load users-with-profile into a normalized full_name → user_id map.
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

  // 4) Process each row.
  for (const row of sourceResult.rows) {
    const employeeName = row.EmployeeName?.trim() ?? null;
    const leaveTypeCode = row.LeaveTypeCode?.trim().toUpperCase() ?? null;

    const startDate = toDateOnly(row.LeaveDate);
    if (!startDate) {
      errors++;
      mismatches.push({
        sourceId: row.id,
        employeeName,
        leaveTypeCode,
        reason: "Invalid or NULL LeaveDate",
      });
      continue;
    }

    const days = toNumber(row.Days);
    if (days === null || days <= 0) {
      errors++;
      mismatches.push({
        sourceId: row.id,
        employeeName,
        leaveTypeCode,
        reason: `Invalid Days value: ${row.Days}`,
      });
      continue;
    }

    // Step 1: resolve user_id by name.
    const nameKey = employeeName
      ? titleCaseName(employeeName).toLowerCase()
      : "";
    const userId = nameKey ? userByName.get(nameKey) : undefined;
    if (!userId) {
      errors++;
      mismatches.push({
        sourceId: row.id,
        employeeName,
        leaveTypeCode,
        reason: `Employee '${employeeName ?? "(empty)"}' not found in hrfs.users`,
      });
      continue;
    }

    // Step 2: resolve leave_type_id by code.
    if (!leaveTypeCode) {
      errors++;
      mismatches.push({
        sourceId: row.id,
        employeeName,
        leaveTypeCode,
        reason: "LeaveTypeCode is empty",
      });
      continue;
    }
    const leaveTypeId = leaveTypeByCode.get(leaveTypeCode);
    if (!leaveTypeId) {
      errors++;
      mismatches.push({
        sourceId: row.id,
        employeeName,
        leaveTypeCode,
        reason: `Leave type code '${leaveTypeCode}' not found in hrfs.leave_types`,
      });
      continue;
    }

    // Step 3: translate status. Days is inclusive of start_date, so end_date
    // is start_date + (days - 1).
    const rawStatus = (row.ApplyStatus ?? "").trim().toUpperCase();
    const status = STATUS_MAP[rawStatus] ?? "pending";
    const endDate = addDays(startDate, Math.max(0, days - 1));

    // Step 4: duplicate detection.
    const existing = await prisma.leave_request.findFirst({
      where: {
        user_id: userId,
        leave_type_id: leaveTypeId,
        start_date: startDate,
      },
      select: { leave_id: true },
    });
    if (existing) {
      skipped++;
      mismatches.push({
        sourceId: row.id,
        employeeName,
        leaveTypeCode,
        reason: `Duplicate of leave_request.leave_id=${existing.leave_id} (same user/type/start_date)`,
      });
      continue;
    }

    if (dryRun) {
      inserted++;
      statusCounts[status] = (statusCounts[status] ?? 0) + 1;
      continue;
    }

    // Step 5: insert.
    try {
      const appliedAt = row.ApplyDate
        ? new Date(row.ApplyDate as string | Date)
        : new Date();
      await prisma.leave_request.create({
        data: {
          user_id: userId,
          leave_type_id: leaveTypeId,
          start_date: startDate,
          end_date: endDate,
          total_days: new Prisma.Decimal(days),
          reason: row.ApplyReason ?? null,
          attachment: row.Attachment ?? null,
          status,
          applied_at: Number.isNaN(appliedAt.getTime()) ? new Date() : appliedAt,
        },
      });
      inserted++;
      statusCounts[status] = (statusCounts[status] ?? 0) + 1;
    } catch (e) {
      errors++;
      const msg = e instanceof Error ? e.message : String(e);
      mismatches.push({
        sourceId: row.id,
        employeeName,
        leaveTypeCode,
        reason: `Insert failed: ${msg}`,
      });
      console.error(
        `[leave-migrate] insert failed for source id=${row.id}:`,
        msg,
      );
    }
  }

  const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
  return {
    success: errors === 0,
    dryRun,
    summary: {
      totalSourceRecords,
      filteredByDate,
      inserted,
      skipped,
      errors,
      duration_ms: Date.now() - startedAt,
    },
    mismatches,
    details: {
      startDate: sixMonthsAgo.toISOString(),
      endDate: new Date().toISOString(),
      statusCounts,
    },
  };
}

export async function POST(request: NextRequest): Promise<Response> {
  const dryRun = request.nextUrl.searchParams.get("dryRun") === "true";
  console.info(
    `[leave-migrate] starting (dryRun=${dryRun}) at ${new Date().toISOString()}`,
  );
  try {
    const result = await runMigration(dryRun);
    console.info(
      `[leave-migrate] done. inserted=${result.summary.inserted} skipped=${result.summary.skipped} errors=${result.summary.errors} dur=${result.summary.duration_ms}ms`,
    );
    return Response.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[leave-migrate] fatal:", msg);
    return Response.json(
      {
        success: false,
        dryRun,
        error: msg,
      },
      { status: 500 },
    );
  }
}
