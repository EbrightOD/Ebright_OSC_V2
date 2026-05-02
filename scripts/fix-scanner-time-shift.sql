-- ============================================================================
-- One-shot backfill: fix the 8-hour shift on attendance_log scans that were
-- ingested BEFORE the parseScanTime() patch in src/lib/scanner-sync.ts.
--
-- HOW TO RUN: each STEP below is a SEPARATE batch — highlight only that
-- step's SQL in HeidiSQL, then press F9 (or Ctrl+F9) to execute that selection.
-- DO NOT run the whole file at once.
-- ============================================================================


-- ============================================================================
-- STEP 0 — Find the cutoff log_id.  (read-only)
-- ============================================================================
-- Run this. Going down the list, find where `scan_myt` switches from morning
-- hours (08:xx, 09:xx) BACK to wrong early-morning hours (00:xx, 01:xx). The
-- last row that's still WRONG is your CUTOFF log_id — note it down.

SELECT
  log_id,
  scan_serial,
  to_char(scan_time AT TIME ZONE 'Asia/Kuala_Lumpur', 'YYYY-MM-DD HH24:MI:SS') AS scan_myt
FROM attendance_log
ORDER BY log_id DESC
LIMIT 80;


-- ============================================================================
-- STEP 1 — Open a transaction and apply the shift.  (NO commit yet)
-- ============================================================================
-- Replace 999999 with the cutoff log_id from Step 0.
-- Highlight & run this whole STEP 1 block. It does NOT commit — the changes
-- are visible to your session only until you decide in Step 3.

BEGIN;

UPDATE attendance_log
SET    scan_time = scan_time + INTERVAL '8 hours'
WHERE  log_id <= 999999;   -- ← replace with cutoff log_id from Step 0

UPDATE attendance a
SET    check_in  = sub.min_scan,
       check_out = CASE WHEN sub.cnt > 1 AND sub.max_scan > sub.min_scan
                        THEN sub.max_scan END
FROM (
  SELECT
    user_id,
    (scan_time AT TIME ZONE 'Asia/Kuala_Lumpur')::date AS myt_date,
    MIN(scan_time) AS min_scan,
    MAX(scan_time) AS max_scan,
    COUNT(*)       AS cnt
  FROM attendance_log
  GROUP BY user_id, (scan_time AT TIME ZONE 'Asia/Kuala_Lumpur')::date
) sub
WHERE a.user_id = sub.user_id
  AND a.date    = sub.myt_date;


-- ============================================================================
-- STEP 2 — PREVIEW the result.  (read-only, still inside the transaction)
-- ============================================================================
-- Highlight & run this. You should now see typical morning times (08:xx, 09:xx)
-- in scan_myt for the cutoff range. Cross-check a few rows against
-- ebright_hrfs.AttendanceLog (clockInTime) to be sure.

SELECT
  log_id,
  scan_serial,
  to_char(scan_time AT TIME ZONE 'Asia/Kuala_Lumpur', 'YYYY-MM-DD HH24:MI:SS') AS scan_myt
FROM attendance_log
ORDER BY log_id DESC
LIMIT 80;

-- Also check the recomputed attendance check-ins:
SELECT
  user_id,
  date,
  to_char(check_in  AT TIME ZONE 'Asia/Kuala_Lumpur', 'HH24:MI:SS') AS check_in_myt,
  to_char(check_out AT TIME ZONE 'Asia/Kuala_Lumpur', 'HH24:MI:SS') AS check_out_myt
FROM attendance
ORDER BY attendance_id DESC
LIMIT 20;


-- ============================================================================
-- STEP 3 — Decide.  Run ONE of these.
-- ============================================================================
-- Looks good — keep the changes:
COMMIT;

-- Looks wrong — throw away:
-- ROLLBACK;
