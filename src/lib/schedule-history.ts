import "server-only";
import { queryEbrightHrfs } from "@/lib/ebright-hrfs";

// Weekly schedule lives on HRFS as BranchStaff.workingHours (jsonb).
// Same shape is used for every versioned snapshot in BranchStaffSchedule.
export type DayKey = "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";
export const DAY_KEYS: DayKey[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type DaySchedule = { start: string; end: string } | null;
export type WeeklySchedule = Partial<Record<DayKey, DaySchedule>>;

export interface ScheduleVersion {
  effectiveFrom: string; // YYYY-MM-DD (MYT calendar)
  schedule: WeeklySchedule;
}

/**
 * Return the schedule with the GREATEST effectiveFrom that is <= dateStr.
 * Returns undefined if dateStr is before the earliest version (caller should
 * then render NO late/early badge for that day — the schedule didn't exist).
 *
 * `versions` must be sorted oldest-first by effectiveFrom.
 */
export function scheduleForDate(
  versions: ScheduleVersion[],
  dateStr: string,
): WeeklySchedule | undefined {
  let result: WeeklySchedule | undefined;
  for (const v of versions) {
    if (v.effectiveFrom <= dateStr) result = v.schedule;
    else break;
  }
  return result;
}

/** True if the weekly schedule has ANY non-null day. */
export function hasSchedule(schedule: WeeklySchedule | null | undefined): boolean {
  if (!schedule) return false;
  for (const k of DAY_KEYS) {
    if (schedule[k]) return true;
  }
  return false;
}

/** The slot (or null) for the dayKey derived from `dateStr` (MYT calendar). */
export function slotForDate(
  schedule: WeeklySchedule | null | undefined,
  dateStr: string,
): DaySchedule {
  if (!schedule) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  // Use UTC midday to avoid any TZ slop when extracting weekday name.
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  const dayKey = DAY_KEYS[dt.getUTCDay()];
  return schedule[dayKey] ?? null;
}

/** Monday-of-the-week (MYT) for the given YYYY-MM-DD — UI default for "Effective from". */
export function mondayOfWeekMyt(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = dt.getUTCDay(); // 0=Sun..6=Sat
  // Sun(0) → -6, Mon(1) → 0, Tue(2) → -1, ... back to Monday.
  const delta = dow === 0 ? -6 : 1 - dow;
  const mon = new Date(dt.getTime() + delta * 86_400_000);
  return `${mon.getUTCFullYear()}-${String(mon.getUTCMonth() + 1).padStart(2, "0")}-${String(mon.getUTCDate()).padStart(2, "0")}`;
}

/** All versions for one staff, oldest-first. */
export async function getVersionsForStaff(
  branchStaffId: number,
): Promise<ScheduleVersion[]> {
  const r = await queryEbrightHrfs<{ effective_from: string; schedule: WeeklySchedule }>(
    // to_char so the date never shifts a day across timezone parsing — the
    // server-side driver would otherwise return a JS Date and we'd risk a UTC
    // re-stringify dropping the calendar day.
    `SELECT to_char("effectiveFrom", 'YYYY-MM-DD') AS effective_from,
            schedule
       FROM public."BranchStaffSchedule"
      WHERE "branchStaffId" = $1
      ORDER BY "effectiveFrom" ASC`,
    [branchStaffId],
  );
  return r.rows.map((row) => ({
    effectiveFrom: row.effective_from,
    schedule: row.schedule,
  }));
}

/**
 * Resolved schedules for every staff that has history, keyed by branchStaffId.
 * - value = schedule object → use it for that date
 * - value = null            → has history but no version covers `dateStr`
 *                             (render WITHOUT late/early — schedule wasn't set yet)
 * - key absent              → no history at all → caller falls back to current
 *                             BranchStaff.workingHours
 */
export async function getResolvedSchedulesForDate(
  dateStr: string,
): Promise<Record<number, WeeklySchedule | null>> {
  const r = await queryEbrightHrfs<{
    branch_staff_id: number;
    effective_from: string;
    schedule: WeeklySchedule;
  }>(
    // Per-staff, pick the row whose effectiveFrom is the most recent <= dateStr.
    // Then UNION-ALL with staff whose earliest version is *after* dateStr so we
    // can mark them as "has history but no schedule covering this date".
    `WITH covered AS (
       SELECT DISTINCT ON ("branchStaffId")
         "branchStaffId" AS branch_staff_id,
         to_char("effectiveFrom", 'YYYY-MM-DD') AS effective_from,
         schedule
       FROM public."BranchStaffSchedule"
       WHERE "effectiveFrom" <= $1::date
       ORDER BY "branchStaffId", "effectiveFrom" DESC
     ),
     uncovered AS (
       SELECT "branchStaffId" AS branch_staff_id,
              ''::text AS effective_from,
              'null'::jsonb AS schedule
         FROM public."BranchStaffSchedule"
        WHERE "branchStaffId" NOT IN (SELECT branch_staff_id FROM covered)
        GROUP BY "branchStaffId"
     )
     SELECT * FROM covered
     UNION ALL
     SELECT * FROM uncovered`,
    [dateStr],
  );
  const out: Record<number, WeeklySchedule | null> = {};
  for (const row of r.rows) {
    out[row.branch_staff_id] = row.effective_from === "" ? null : row.schedule;
  }
  return out;
}

/**
 * Upsert a versioned schedule for one staff, AND keep the cached current
 * BranchStaff.workingHours in sync. Two separate statements (the pg extended
 * protocol can't combine them with params); if the cache update fails, the
 * version row is still authoritative and the next edit will re-sync the cache.
 */
export async function upsertScheduleVersion(args: {
  branchStaffId: number;
  effectiveFrom: string;
  schedule: WeeklySchedule;
}): Promise<void> {
  const { branchStaffId, effectiveFrom, schedule } = args;
  const scheduleJson = JSON.stringify(schedule);
  await queryEbrightHrfs(
    `INSERT INTO public."BranchStaffSchedule" ("branchStaffId", "effectiveFrom", schedule)
     VALUES ($1, $2::date, $3::jsonb)
     ON CONFLICT ("branchStaffId", "effectiveFrom")
     DO UPDATE SET schedule = EXCLUDED.schedule`,
    [branchStaffId, effectiveFrom, scheduleJson],
  );
  await queryEbrightHrfs(
    `UPDATE public."BranchStaff" SET "workingHours" = $1::jsonb WHERE id = $2`,
    [scheduleJson, branchStaffId],
  );
}
