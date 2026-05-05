// One-shot script to re-sync all ebrightleads data into local hrfs with the
// fixed timezone normalization. Run once after the sync code change:
//
//   node scripts/resync-ebrightleads.mjs
//
// Bypasses the 1-hour auto-sync cooldown by calling the sync functions
// directly. Existing records are upserted in place, so this is idempotent.

import "dotenv/config";
import pg from "pg";
const { Pool } = pg;

function normalizeMytDate(d) {
  const date = d instanceof Date ? d : new Date(d);
  const shifted = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  shifted.setUTCHours(0, 0, 0, 0);
  return shifted;
}

const ebr = new Pool({
  host: process.env.EBRIGHTLEADS_HOST,
  port: parseInt(process.env.EBRIGHTLEADS_PORT || "5433", 10),
  user: process.env.EBRIGHTLEADS_USER,
  password: process.env.EBRIGHTLEADS_PASSWORD,
  database: process.env.EBRIGHTLEADS_DATABASE,
});
const local = new Pool({ connectionString: process.env.DATABASE_URL });

async function syncOnboarding() {
  const r = await ebr.query(
    `SELECT id, name, position, department_branch, start_date, end_date FROM hr_staff_movements`
  );
  const now = new Date();
  let synced = 0;
  for (const row of r.rows) {
    const startDate = normalizeMytDate(row.start_date);
    const endDate = row.end_date ? normalizeMytDate(row.end_date) : null;
    let candidateType = "active";
    if (startDate > now) candidateType = "onboarding";
    else if (endDate) {
      const thirty = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      if (endDate > now && endDate <= thirty) candidateType = "offboarding";
    }
    const thirtyAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (candidateType === "active" && startDate >= thirtyAgo && startDate <= now) {
      candidateType = "recent_join";
    }
    await local.query(
      `INSERT INTO onboarding_candidate (source_id, name, position, department_branch, candidate_type, start_date, end_date, synced_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8)
       ON CONFLICT (source_id) DO UPDATE SET
         name=EXCLUDED.name, position=EXCLUDED.position, department_branch=EXCLUDED.department_branch,
         candidate_type=EXCLUDED.candidate_type, start_date=EXCLUDED.start_date, end_date=EXCLUDED.end_date,
         synced_at=EXCLUDED.synced_at, updated_at=EXCLUDED.updated_at`,
      [
        row.id,
        row.name,
        row.position,
        row.department_branch,
        candidateType,
        startDate,
        endDate,
        now,
      ]
    );
    synced++;
  }
  console.log(`onboarding_candidate: ${synced} rows`);
}

async function syncMc() {
  const r = await ebr.query(
    `SELECT id, name, position, department_branch, mc_date, reason FROM hr_mc`
  );
  const now = new Date();
  let synced = 0;
  for (const row of r.rows) {
    const mcDate = normalizeMytDate(row.mc_date);
    await local.query(
      `INSERT INTO mc_record (source_id, name, position, department_branch, mc_date, reason, synced_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$7)
       ON CONFLICT (source_id) DO UPDATE SET
         name=EXCLUDED.name, position=EXCLUDED.position, department_branch=EXCLUDED.department_branch,
         mc_date=EXCLUDED.mc_date, reason=EXCLUDED.reason, synced_at=EXCLUDED.synced_at, updated_at=EXCLUDED.updated_at`,
      [row.id, row.name, row.position, row.department_branch, mcDate, row.reason, now]
    );
    synced++;
  }
  console.log(`mc_record: ${synced} rows`);
}

async function syncAl() {
  const r = await ebr.query(
    `SELECT id, name, position, department_branch, al_date, al_duration FROM hr_annual_leave`
  );
  const now = new Date();
  let synced = 0;
  for (const row of r.rows) {
    const alDate = normalizeMytDate(row.al_date);
    await local.query(
      `INSERT INTO annual_leave_record (source_id, name, position, department_branch, al_date, al_duration, synced_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$7)
       ON CONFLICT (source_id) DO UPDATE SET
         name=EXCLUDED.name, position=EXCLUDED.position, department_branch=EXCLUDED.department_branch,
         al_date=EXCLUDED.al_date, al_duration=EXCLUDED.al_duration, synced_at=EXCLUDED.synced_at, updated_at=EXCLUDED.updated_at`,
      [row.id, row.name, row.position, row.department_branch, alDate, row.al_duration, now]
    );
    synced++;
  }
  console.log(`annual_leave_record: ${synced} rows`);
}

try {
  await syncOnboarding();
  await syncMc();
  await syncAl();
  console.log("Done. Reload the dashboard.");
} catch (e) {
  console.error("FAILED:", e.message);
  process.exitCode = 1;
} finally {
  await ebr.end();
  await local.end();
}
