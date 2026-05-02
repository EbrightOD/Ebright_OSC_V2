/**
 * scanner-sync.ts
 *
 * Polls every Hikvision device in the `devices` table for today's scan events,
 * then writes them into the new schema:
 *   - one row per scan into `attendance_log` (idempotent via partial unique on
 *     (device_id, scan_serial))
 *   - one row per (user_id, date) into `attendance`, with check_in / check_out
 *     derived from MIN/MAX scan_time of that day's logs
 *
 * Triggered by `instrumentation.ts` on a fixed setInterval.
 *
 * The OLD attendance app polls the same scanner independently and writes to
 * its own DB. Both DBs stay in sync without coordination.
 */

import { request } from "urllib";
import { prisma } from "@/lib/prisma";
import { mytDateOnly, mytDayUtcBounds, mytIsoLocal } from "@/lib/myt";

interface ScanEvent {
  employeeNoString: string;
  time: string; // ISO-8601 with offset, e.g. "2025-04-12T08:31:00+08:00"
  serialNo: string | number;
}

interface AcsResponse {
  AcsEvent?: {
    InfoList?: ScanEvent[];
    numOfMatches?: number;
  };
}

interface DeviceRow {
  device_id: number;
  ip_address: string;
}

const HIKVISION_PAGE_SIZE = 30;
const HIKVISION_MAX_PAGES = 50; // safety guard against runaway pagination
const HIKVISION_TIMEOUT_MS = 8000;

// ─── Hikvision fetch ─────────────────────────────────────────────────────────

async function fetchTodayEvents(device: DeviceRow): Promise<ScanEvent[]> {
  const user = process.env.HIKVISION_USER;
  const pass = process.env.HIKVISION_PASS;
  if (!user || !pass) {
    console.error(
      "[scanner-sync] HIKVISION_USER / HIKVISION_PASS not set in .env",
    );
    return [];
  }

  const url = `http://${device.ip_address}/ISAPI/AccessControl/AcsEvent?format=json`;
  const auth = `${user}:${pass}`;

  const now = new Date();
  const { start: startOfToday } = mytDayUtcBounds(now);

  const all: ScanEvent[] = [];
  let position = 0;

  for (let page = 0; page < HIKVISION_MAX_PAGES; page++) {
    try {
      const { data, res } = await request(url, {
        method: "POST",
        digestAuth: auth,
        // Use `data` (object), not `content` (string) — urllib re-attaches
        // `data` on the digest-auth retry; `content` gets dropped.
        data: {
          AcsEventCond: {
            searchID: Date.now().toString(),
            searchResultPosition: position,
            maxResults: HIKVISION_PAGE_SIZE,
            major: 0,
            minor: 0,
            startTime: mytIsoLocal(startOfToday),
            endTime: mytIsoLocal(now),
          },
        },
        contentType: "application/json",
        dataType: "json",
        timeout: HIKVISION_TIMEOUT_MS,
      });

      if (res.statusCode === 401) {
        console.error(
          `[scanner-sync][${device.ip_address}] 401 Unauthorized — check HIKVISION_USER/PASS`,
        );
        break;
      }
      if (res.statusCode !== 200) {
        console.error(
          `[scanner-sync][${device.ip_address}] HTTP ${res.statusCode}`,
        );
        break;
      }

      const batch = (data as AcsResponse).AcsEvent?.InfoList ?? [];
      if (batch.length === 0) break;

      all.push(...batch);
      position += batch.length;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const hint = msg.includes("ECONNREFUSED")
        ? " — scanner unreachable"
        : msg.includes("ETIMEDOUT")
          ? " — connection timed out"
          : "";
      console.error(
        `[scanner-sync][${device.ip_address}] network error${hint}:`,
        msg,
      );
      break;
    }
  }

  return all;
}

// ─── Scanner-time parsing ────────────────────────────────────────────────────

// Hikvision sometimes returns event timestamps without an explicit timezone
// offset (e.g. "2026-05-02T08:42:51"). When that happens, JS's `new Date()`
// uses the host's local timezone — which under Docker / Vercel is usually UTC,
// not MYT. The scanner clock is set to MYT, so a naive timestamp is *always*
// MYT. Anchor it explicitly to +08:00 before parsing so the absolute UTC
// instant we store is correct regardless of where this code runs.
const TZ_OFFSET_RX = /Z$|[+-]\d{2}:?\d{2}$/;

export function parseScanTime(raw: string): Date {
  const s = raw.trim();
  if (TZ_OFFSET_RX.test(s)) return new Date(s);
  return new Date(`${s}+08:00`);
}

// ─── DB write ────────────────────────────────────────────────────────────────

async function writeEvent(
  device: DeviceRow,
  event: ScanEvent,
  userIdByEmpNo: Map<string, number>,
): Promise<"inserted" | "duplicate" | "skipped"> {
  if (!event.employeeNoString || event.employeeNoString === "0") {
    return "skipped";
  }

  const userId = userIdByEmpNo.get(event.employeeNoString);
  if (userId == null) {
    // Unknown employee — log once per cycle would be nice but each call is
    // independent; just warn and move on.
    console.warn(
      `[scanner-sync][${device.ip_address}] no employment row for empNo=${event.employeeNoString}`,
    );
    return "skipped";
  }

  const scanTime = parseScanTime(event.time);
  if (Number.isNaN(scanTime.getTime())) {
    console.warn(
      `[scanner-sync][${device.ip_address}] bad scan time: ${event.time}`,
    );
    return "skipped";
  }

  const serial = String(event.serialNo);
  const date = mytDateOnly(scanTime);

  // 1. Insert log row — idempotent via partial unique on (device_id, scan_serial).
  const inserted = await prisma.$queryRaw<Array<{ log_id: number }>>`
    INSERT INTO attendance_log (user_id, scan_time, scan_type, device_id, scan_serial)
    VALUES (${userId}, ${scanTime}, 'scan', ${device.device_id}, ${serial})
    ON CONFLICT (device_id, scan_serial) WHERE scan_serial IS NOT NULL
    DO NOTHING
    RETURNING log_id
  `;
  const logId = inserted[0]?.log_id ?? null;

  if (logId === null) return "duplicate";

  // 2. Recompute attendance from all logs that day.
  const { start, end } = mytDayUtcBounds(scanTime);
  const dayAgg = await prisma.attendance_log.aggregate({
    where: {
      user_id: userId,
      scan_time: { gte: start, lt: end },
    },
    _min: { scan_time: true },
    _max: { scan_time: true },
    _count: { _all: true },
  });

  const minScan = dayAgg._min.scan_time;
  const maxScan = dayAgg._max.scan_time;
  const checkOut =
    dayAgg._count._all > 1 && maxScan && minScan && maxScan > minScan
      ? maxScan
      : null;

  const upserted = await prisma.attendance.upsert({
    where: { user_id_date: { user_id: userId, date } },
    create: {
      user_id: userId,
      date,
      check_in: minScan,
      check_out: checkOut,
      device_id: device.device_id,
      status: "present",
    },
    update: {
      check_in: minScan,
      check_out: checkOut,
    },
    select: { attendance_id: true },
  });

  // 3. Link log row to its attendance row.
  await prisma.attendance_log.update({
    where: { log_id: logId },
    data: { attendance_id: upserted.attendance_id },
  });

  // 4. Re-tag scan_type for the day so the DB row is self-explanatory.
  await retagScanTypesForDay(userId, start, end);

  return "inserted";
}

// Update scan_type for every log on a given (user, day): first = check_in,
// last (when count > 1) = check_out, anything in between = scan. Idempotent.
async function retagScanTypesForDay(
  userId: number,
  dayStart: Date,
  dayEnd: Date,
): Promise<void> {
  await prisma.$executeRaw`
    WITH ranked AS (
      SELECT
        log_id,
        ROW_NUMBER() OVER (ORDER BY scan_time ASC) AS rn,
        COUNT(*) OVER () AS total
      FROM attendance_log
      WHERE user_id = ${userId}
        AND scan_time >= ${dayStart}
        AND scan_time <  ${dayEnd}
    )
    UPDATE attendance_log al
    SET scan_type = CASE
      WHEN r.rn = 1 THEN 'check_in'
      WHEN r.rn = r.total AND r.total > 1 THEN 'check_out'
      ELSE 'scan'
    END
    FROM ranked r
    WHERE al.log_id = r.log_id
      AND al.scan_type IS DISTINCT FROM CASE
        WHEN r.rn = 1 THEN 'check_in'
        WHEN r.rn = r.total AND r.total > 1 THEN 'check_out'
        ELSE 'scan'
      END
  `;
}

// ─── Per-device processing ───────────────────────────────────────────────────

async function processDevice(
  device: DeviceRow,
  userIdByEmpNo: Map<string, number>,
): Promise<{ device: string; total: number; inserted: number; duplicate: number; skipped: number }> {
  const events = await fetchTodayEvents(device);
  const counts = { inserted: 0, duplicate: 0, skipped: 0 };
  for (const ev of events) {
    const result = await writeEvent(device, ev, userIdByEmpNo);
    counts[result]++;
  }
  return { device: device.ip_address, total: events.length, ...counts };
}

// ─── Main entry point ────────────────────────────────────────────────────────

let running = false; // mutex against overlapping cycles

export async function syncScannerToDb(): Promise<void> {
  if (running) {
    console.log("[scanner-sync] previous cycle still running — skipping");
    return;
  }
  running = true;

  try {
    const devices = await prisma.devices.findMany({
      where: { ip_address: { not: null } },
      select: { device_id: true, ip_address: true },
    });
    if (devices.length === 0) {
      console.log("[scanner-sync] no devices with ip_address — nothing to do");
      return;
    }

    // Build empNo → user_id lookup once per cycle.
    const employments = await prisma.employment.findMany({
      where: { employee_id: { not: null } },
      select: { employee_id: true, user_id: true, employment_id: true },
      orderBy: { employment_id: "desc" },
    });
    const userIdByEmpNo = new Map<string, number>();
    for (const e of employments) {
      // First (most recent) employment wins per employee_id.
      if (e.employee_id && !userIdByEmpNo.has(e.employee_id)) {
        userIdByEmpNo.set(e.employee_id, e.user_id);
      }
    }

    const results = await Promise.all(
      devices
        .filter((d): d is DeviceRow => d.ip_address !== null)
        .map((d) => processDevice(d, userIdByEmpNo)),
    );

    for (const r of results) {
      if (r.total > 0) {
        console.log(
          `[scanner-sync][${r.device}] events=${r.total} inserted=${r.inserted} duplicate=${r.duplicate} skipped=${r.skipped}`,
        );
      }
    }
  } catch (err) {
    console.error("[scanner-sync] cycle failed:", err);
  } finally {
    running = false;
  }
}
