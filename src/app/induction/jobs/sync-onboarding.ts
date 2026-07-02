import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { queryEbrightLeads } from "@/lib/ebrightleads";
import { queryEbrightHrfs } from "@/lib/ebright-hrfs";
import { titleCaseName } from "@/lib/text";

export interface SyncResult {
  success: boolean;
  synced: number;
  errors: string[];
}

// Shape of a row pulled from HRFS public.branchstaff. Mixed snake_case /
// camelCase column names mirror the upstream schema; dates are stored as
// plain "YYYY-MM-DD" text, not timestamps.
interface RawBranchStaff {
  id: number;
  name: string | null;
  position: string | null;
  department: string | null;
  branch: string | null;
  start_date: string | null;
  endDate: string | null;
}

// branchstaff stores dates as text ("YYYY-MM-DD" or empty). This returns a
// UTC-midnight Date matching the calendar day, or null for empty/invalid.
function parseHrfsTextDate(s: string | null): Date | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s.trim());
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return Number.isNaN(d.getTime()) ? null : d;
}

// pg returns ebrightleads `date` columns as `YYYY-MM-DDT16:00:00Z` because the
// remote session timezone is Asia/Kuala_Lumpur — that timestamp is midnight
// MYT of the next day. If we insert it directly into a `date` column on a
// UTC-session client (local hrfs), pg truncates to UTC and stores the wrong
// calendar day. Adding 8h and zeroing the time gives a UTC-midnight Date that
// represents the actual MYT calendar date.
function normalizeMytDate(d: Date | string): Date {
  const date = d instanceof Date ? d : new Date(d);
  const shifted = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  shifted.setUTCHours(0, 0, 0, 0);
  return shifted;
}

function classifyCandidate(
  startDate: Date,
  endDate: Date | null,
  now: Date
): "onboarding" | "offboarding" | "recent_join" | "active" {
  if (startDate > now) return "onboarding";

  if (endDate) {
    const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (endDate > now && endDate <= thirtyDaysOut) return "offboarding";
  }

  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  if (startDate >= thirtyDaysAgo && startDate <= now) return "recent_join";

  return "active";
}

export async function syncOnboardingCandidatesFromEbrightLeads(): Promise<SyncResult> {
  const result: SyncResult = { success: true, synced: 0, errors: [] };

  try {
    // BranchStaff (PascalCase) on HRFS — must be double-quoted or Postgres
    // folds to lowercase and "relation does not exist".
    const hrfsResult = await queryEbrightHrfs<RawBranchStaff>(
      `SELECT id, name, position, department, branch, start_date, "endDate"
         FROM public."BranchStaff"
        WHERE start_date IS NOT NULL
        ORDER BY start_date DESC`,
    );

    const rows = hrfsResult.rows ?? [];

    const now = new Date();

    for (const row of rows) {
      try {
        const startDate = parseHrfsTextDate(row.start_date);
        if (!startDate) {
          // Row has no usable start_date — skip silently. (Some branchstaff
          // rows are placeholders without dates.)
          continue;
        }
        const endDate = parseHrfsTextDate(row.endDate);
        const candidateType = classifyCandidate(startDate, endDate, now);

        const name = row.name?.trim() || "(unnamed)";
        const position = row.position?.trim() || "";
        // department is the more specific field; fall back to branch when null.
        const departmentBranch =
          row.department?.trim() || row.branch?.trim() || "";

        await prisma.onboarding_candidate.upsert({
          where: { source_id: row.id },
          update: {
            name,
            position,
            department_branch: departmentBranch,
            start_date: startDate,
            end_date: endDate,
            candidate_type: candidateType,
            synced_at: now,
          },
          create: {
            source_id: row.id,
            name,
            position,
            department_branch: departmentBranch,
            start_date: startDate,
            end_date: endDate,
            candidate_type: candidateType,
          },
        });

        result.synced++;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        result.errors.push(`Failed to sync ${row.name ?? `id=${row.id}`}: ${msg}`);
      }
    }

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    result.success = false;
    result.errors.push(`Sync failed: ${msg}`);
    console.error("[induction] Sync error:", msg);
  }

  return result;
}

export async function shouldRunSync(): Promise<boolean> {
  const lastSync = await prisma.onboarding_candidate.findFirst({
    orderBy: { synced_at: "desc" },
    select: { synced_at: true },
  });

  if (!lastSync) return true;

  const elapsed = Date.now() - lastSync.synced_at.getTime();
  return elapsed > 60 * 60 * 1000;
}

interface RawMcRow {
  id: number;
  name: string;
  position: string;
  department_branch: string;
  mc_date: Date | string;
  reason: string | null;
}

interface RawAlRow {
  id: number;
  name: string;
  position: string;
  department_branch: string;
  al_date: Date | string;
  al_duration: string | null;
}

export async function syncMcRecordsFromEbrightLeads(): Promise<SyncResult> {
  const result: SyncResult = { success: true, synced: 0, errors: [] };
  try {
    const r = await queryEbrightLeads<RawMcRow>(
      `SELECT id, name, position, department_branch, mc_date, reason
       FROM hr_mc ORDER BY mc_date DESC`,
    );
    const rows = r.rows ?? [];
    const now = new Date();
    for (const row of rows) {
      try {
        const mcDate = normalizeMytDate(row.mc_date);
        await prisma.mc_record.upsert({
          where: { source_id: row.id },
          update: {
            name: row.name,
            position: row.position,
            department_branch: row.department_branch,
            mc_date: mcDate,
            reason: row.reason,
            synced_at: now,
          },
          create: {
            source_id: row.id,
            name: row.name,
            position: row.position,
            department_branch: row.department_branch,
            mc_date: mcDate,
            reason: row.reason,
          },
        });
        result.synced++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        result.errors.push(`MC ${row.name}: ${msg}`);
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    result.success = false;
    result.errors.push(`MC sync failed: ${msg}`);
  }
  return result;
}

export async function syncAnnualLeaveFromEbrightLeads(): Promise<SyncResult> {
  const result: SyncResult = { success: true, synced: 0, errors: [] };
  try {
    const r = await queryEbrightLeads<RawAlRow>(
      `SELECT id, name, position, department_branch, al_date, al_duration
       FROM hr_annual_leave ORDER BY al_date DESC`,
    );
    const rows = r.rows ?? [];
    const now = new Date();
    for (const row of rows) {
      try {
        const alDate = normalizeMytDate(row.al_date);
        await prisma.annual_leave_record.upsert({
          where: { source_id: row.id },
          update: {
            name: row.name,
            position: row.position,
            department_branch: row.department_branch,
            al_date: alDate,
            al_duration: row.al_duration,
            synced_at: now,
          },
          create: {
            source_id: row.id,
            name: row.name,
            position: row.position,
            department_branch: row.department_branch,
            al_date: alDate,
            al_duration: row.al_duration,
          },
        });
        result.synced++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        result.errors.push(`AL ${row.name}: ${msg}`);
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    result.success = false;
    result.errors.push(`AL sync failed: ${msg}`);
  }
  return result;
}

// ============ HRFS LeaveTransaction → local leave_request ============

interface RawLeaveTransaction {
  id: number;
  EmployeeCode: string | null;
  LeaveTypeCode: string | null;
  ApplyDate: Date | string | null;
  ApplyReason: string | null;
  ApplyStatus: string | null;
  Attachment: string | null;
  LeaveDate: Date | string | null;
  Days: number | string | null;
  EmployeeName: string | null;
}

const LEAVE_STATUS_MAP: Record<string, string> = {
  A: "approved",
  N: "pending",
  R: "rejected",
  C: "cancelled",
};

function parseLeaveTransactionDate(value: Date | string | null): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  // HRFS stores LeaveDate as a `date` with MYT offset. Shift +8h then snap to
  // UTC midnight so the calendar day matches.
  const shifted = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  shifted.setUTCHours(0, 0, 0, 0);
  return shifted;
}

function addDaysUtc(date: Date, days: number): Date {
  const out = new Date(date);
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}

// In-memory cooldown marker for the leave sync. Resets on server restart
// (which is desirable — fresh process = fresh data). 1 hour between runs.
let lastLeaveSyncAt = 0;
const LEAVE_SYNC_COOLDOWN_MS = 60 * 60 * 1000;

/**
 * Sync HRFS public.LeaveTransaction → local leave_request. Pulls the last
 * 6 months, matches employees by full_name against user_profile, and inserts
 * any rows that don't already exist (dedup key: user + leave_type + start_date).
 *
 * Returns aggregate counts; detailed mismatches are not surfaced here (use the
 * /api/migrations/leave-transaction-migrate route for that).
 */
export async function syncLeaveTransactionsFromHrfs(): Promise<SyncResult> {
  const result: SyncResult = { success: true, synced: 0, errors: [] };

  try {
    const sourceResult = await queryEbrightHrfs<RawLeaveTransaction>(
      `SELECT id,
              "EmployeeCode",
              "LeaveTypeCode",
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

    const rows = sourceResult.rows ?? [];

    // Pre-load lookup maps for fast resolution.
    const [leaveTypes, users, employments] = await Promise.all([
      prisma.leave_types.findMany({
        select: { leave_type_id: true, leave_type_code: true },
      }),
      prisma.users.findMany({
        where: { user_profile: { isNot: null } },
        select: {
          user_id: true,
          user_profile: { select: { full_name: true } },
        },
      }),
      // Code-based map: HRFS LeaveTransaction.EmployeeCode → local
      // employment.employee_id → user_id. More reliable than name match (and
      // many LeaveTransaction rows have NULL EmployeeName).
      prisma.employment.findMany({
        where: { employee_id: { not: null } },
        select: { employee_id: true, user_id: true },
      }),
    ]);
    const leaveTypeByCode = new Map<string, number>();
    for (const lt of leaveTypes) {
      leaveTypeByCode.set(lt.leave_type_code.toUpperCase(), lt.leave_type_id);
    }
    const userByName = new Map<string, number>();
    for (const u of users) {
      const raw = u.user_profile?.full_name;
      if (!raw) continue;
      const key = titleCaseName(raw).toLowerCase();
      if (key && !userByName.has(key)) userByName.set(key, u.user_id);
    }
    const userByEmployeeCode = new Map<string, number>();
    for (const e of employments) {
      const code = e.employee_id?.trim().toUpperCase();
      if (code && !userByEmployeeCode.has(code)) {
        userByEmployeeCode.set(code, e.user_id);
      }
    }

    for (const row of rows) {
      try {
        const startDate = parseLeaveTransactionDate(row.LeaveDate);
        if (!startDate) continue;

        const daysRaw =
          typeof row.Days === "number"
            ? row.Days
            : typeof row.Days === "string"
              ? parseFloat(row.Days)
              : null;
        if (daysRaw === null || !Number.isFinite(daysRaw) || daysRaw <= 0) {
          continue;
        }

        // Try EmployeeCode first (stable, populated even when EmployeeName is
        // null). Fall back to EmployeeName for legacy rows without a code.
        const codeKey = row.EmployeeCode?.trim().toUpperCase() ?? "";
        let userId = codeKey ? userByEmployeeCode.get(codeKey) : undefined;
        if (!userId) {
          const nameKey = row.EmployeeName
            ? titleCaseName(row.EmployeeName).toLowerCase()
            : "";
          userId = nameKey ? userByName.get(nameKey) : undefined;
        }
        if (!userId) continue;

        const leaveTypeCode = row.LeaveTypeCode?.trim().toUpperCase() ?? "";
        const leaveTypeId = leaveTypeByCode.get(leaveTypeCode);
        if (!leaveTypeId) continue;

        const rawStatus = (row.ApplyStatus ?? "").trim().toUpperCase();
        const status = LEAVE_STATUS_MAP[rawStatus] ?? "pending";
        const endDate = addDaysUtc(startDate, Math.max(0, daysRaw - 1));

        const existing = await prisma.leave_request.findFirst({
          where: {
            user_id: userId,
            leave_type_id: leaveTypeId,
            start_date: startDate,
          },
          select: { leave_id: true },
        });
        if (existing) continue;

        const appliedAt = row.ApplyDate
          ? new Date(row.ApplyDate as string | Date)
          : new Date();
        await prisma.leave_request.create({
          data: {
            user_id: userId,
            leave_type_id: leaveTypeId,
            start_date: startDate,
            end_date: endDate,
            total_days: new Prisma.Decimal(daysRaw),
            reason: row.ApplyReason ?? null,
            attachment: row.Attachment ?? null,
            status,
            applied_at: Number.isNaN(appliedAt.getTime()) ? new Date() : appliedAt,
          },
        });
        result.synced++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        result.errors.push(`LeaveTransaction ${row.id}: ${msg}`);
      }
    }

    lastLeaveSyncAt = Date.now();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    result.success = false;
    result.errors.push(`LeaveTransaction sync failed: ${msg}`);
    console.error("[induction] LeaveTransaction sync error:", msg);
  }
  return result;
}

export function shouldRunLeaveTransactionSync(): boolean {
  return Date.now() - lastLeaveSyncAt > LEAVE_SYNC_COOLDOWN_MS;
}

export async function syncAllFromEbrightLeads(): Promise<{
  onboarding: SyncResult;
  mc: SyncResult;
  al: SyncResult;
  leaveTransactions: SyncResult;
}> {
  // Leave-transaction sync runs at most once per cooldown window. The others
  // are gated upstream by shouldRunSync (onboarding_candidate.synced_at).
  const runLeave = shouldRunLeaveTransactionSync();
  const [onboarding, mc, al, leaveTransactions] = await Promise.all([
    syncOnboardingCandidatesFromEbrightLeads(),
    syncMcRecordsFromEbrightLeads(),
    syncAnnualLeaveFromEbrightLeads(),
    runLeave
      ? syncLeaveTransactionsFromHrfs()
      : Promise.resolve<SyncResult>({ success: true, synced: 0, errors: [] }),
  ]);
  return { onboarding, mc, al, leaveTransactions };
}
