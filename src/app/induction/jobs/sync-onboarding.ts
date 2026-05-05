import "server-only";
import { prisma } from "@/lib/prisma";
import { queryEbrightLeads } from "@/lib/ebrightleads";

export interface SyncResult {
  success: boolean;
  synced: number;
  errors: string[];
}

interface RawStaffMovement {
  id: number;
  name: string;
  position: string;
  department_branch: string;
  start_date: Date | string;
  end_date: Date | string | null;
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
    console.info("[induction] Sync: starting from ebrightleads_db");

    const ebrightResult = await queryEbrightLeads<RawStaffMovement>(
      `SELECT id, name, position, department_branch, start_date, end_date
       FROM hr_staff_movements
       ORDER BY start_date DESC`
    );

    const movements = ebrightResult.rows ?? [];
    console.info(
      `[induction] Sync: found ${movements.length} rows in hr_staff_movements`
    );

    const now = new Date();

    for (const movement of movements) {
      try {
        const startDate = normalizeMytDate(movement.start_date);
        const endDate = movement.end_date ? normalizeMytDate(movement.end_date) : null;
        const candidateType = classifyCandidate(startDate, endDate, now);

        await prisma.onboarding_candidate.upsert({
          where: { source_id: movement.id },
          update: {
            name: movement.name,
            position: movement.position,
            department_branch: movement.department_branch,
            start_date: startDate,
            end_date: endDate,
            candidate_type: candidateType,
            synced_at: now,
          },
          create: {
            source_id: movement.id,
            name: movement.name,
            position: movement.position,
            department_branch: movement.department_branch,
            start_date: startDate,
            end_date: endDate,
            candidate_type: candidateType,
          },
        });

        result.synced++;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        result.errors.push(`Failed to sync ${movement.name}: ${msg}`);
      }
    }

    console.info(
      `[induction] Sync: complete. synced=${result.synced} errors=${result.errors.length}`
    );
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
    console.info(
      `[induction] MC sync complete. synced=${result.synced} errors=${result.errors.length}`,
    );
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
    console.info(
      `[induction] AL sync complete. synced=${result.synced} errors=${result.errors.length}`,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    result.success = false;
    result.errors.push(`AL sync failed: ${msg}`);
  }
  return result;
}

export async function syncAllFromEbrightLeads(): Promise<{
  onboarding: SyncResult;
  mc: SyncResult;
  al: SyncResult;
}> {
  const [onboarding, mc, al] = await Promise.all([
    syncOnboardingCandidatesFromEbrightLeads(),
    syncMcRecordsFromEbrightLeads(),
    syncAnnualLeaveFromEbrightLeads(),
  ]);
  return { onboarding, mc, al };
}
