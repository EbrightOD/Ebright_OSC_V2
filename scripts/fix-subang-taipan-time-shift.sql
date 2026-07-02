-- ============================================================================
-- One-shot backfill: fix the 8-hour shift on Subang Taipan (device_id=2) scans
-- caused by the scanner's hardware clock being set to UTC instead of MYT.
--
-- Real-world scans happened in the morning (~08:00 MYT) but the device
-- recorded them with naive ~00:00 timestamps. scanner-sync correctly anchors
-- naive timestamps to +08:00, so they got stored 8h late. This script shifts
-- those rows forward 8h to match the real scan time.
--
-- IMPORTANT: do NOT run this until you've reset the device clock at
-- 192.168.1.112 → Configuration → System → Time → Asia/Kuala_Lumpur (UTC+8).
-- Otherwise the next sync will keep ingesting more misaligned scans.
--
-- HOW TO RUN: each STEP below is a SEPARATE batch — highlight only that
-- step's SQL in HeidiSQL, then press F9 (or Ctrl+F9) to execute that selection.
-- DO NOT run the whole file at once.
-- ============================================================================


-- ============================================================================
-- STEP 0 — Confirm the affected rows.  (read-only)
-- ============================================================================
-- You should see exactly 4 rows: log_id 160539, 160540, 160541, 160542,
-- all device_id=2, with scan_myt times around 23:59-00:29.

SELECT
  log_id,
  user_id,
  device_id,
  scan_serial,
  scan_type,
  to_char(scan_time AT TIME ZONE 'Asia/Kuala_Lumpur', 'YYYY-MM-DD HH24:MI:SS') AS scan_myt
FROM attendance_log
WHERE log_id IN (160539, 160540, 160541, 160542)
ORDER BY log_id;


-- ============================================================================
-- STEP 1 — Open a transaction and apply the shift.  (NO commit yet)
-- ============================================================================
-- Highlight & run this whole STEP 1 block. It does NOT commit — the changes
-- are visible to your session only until you decide in Step 3.

BEGIN;

-- Shift the 4 misaligned log rows forward 8 hours.
UPDATE attendance_log
SET    scan_time = scan_time + INTERVAL '8 hours'
WHERE  log_id IN (160539, 160540, 160541, 160542);

-- Recompute the attendance rows for the affected (user, MYT-day) pairs.
-- Pulls MIN/MAX/COUNT of *all* their logs that day (in case other logs exist
-- that we want to mix in), and updates check_in/check_out accordingly.
WITH affected AS (
  SELECT DISTINCT
    al.user_id,
    (al.scan_time AT TIME ZONE 'Asia/Kuala_Lumpur')::date AS myt_date
  FROM attendance_log al
  WHERE al.log_id IN (160539, 160540, 160541, 160542)
),
recomputed AS (
  SELECT
    a.user_id,
    a.myt_date,
    MIN(al.scan_time) AS min_scan,
    MAX(al.scan_time) AS max_scan,
    COUNT(*)          AS cnt
  FROM affected a
  JOIN attendance_log al
    ON al.user_id = a.user_id
   AND (al.scan_time AT TIME ZONE 'Asia/Kuala_Lumpur')::date = a.myt_date
  GROUP BY a.user_id, a.myt_date
)
UPDATE attendance att
SET    check_in  = r.min_scan,
       check_out = CASE WHEN r.cnt > 1 AND r.max_scan > r.min_scan
                        THEN r.max_scan END
FROM   recomputed r
WHERE  att.user_id = r.user_id
  AND  att.date    = r.myt_date;


-- ============================================================================
-- STEP 2 — PREVIEW the result.  (read-only, still inside the transaction)
-- ============================================================================
-- The 4 logs should now show MYT times around 07:59-08:29 instead of 23:59-00:29.

SELECT
  log_id,
  user_id,
  device_id,
  scan_serial,
  scan_type,
  to_char(scan_time AT TIME ZONE 'Asia/Kuala_Lumpur', 'YYYY-MM-DD HH24:MI:SS') AS scan_myt
FROM attendance_log
WHERE log_id IN (160539, 160540, 160541, 160542)
ORDER BY log_id;

-- And the attendance rows should reflect the new check-in / check-out:
SELECT
  attendance_id,
  user_id,
  date,
  to_char(check_in  AT TIME ZONE 'Asia/Kuala_Lumpur', 'HH24:MI:SS') AS check_in_myt,
  to_char(check_out AT TIME ZONE 'Asia/Kuala_Lumpur', 'HH24:MI:SS') AS check_out_myt
FROM attendance
WHERE attendance_id IN (137, 138, 140)
ORDER BY attendance_id;


-- ============================================================================
-- STEP 3 — Decide.  Run ONE of these.
-- ============================================================================
-- Looks good — keep the changes:
COMMIT;

-- Looks wrong — throw away:
-- ROLLBACK;
