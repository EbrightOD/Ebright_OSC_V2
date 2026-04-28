import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mytDateOnly, mytDayUtcBounds } from "@/lib/myt";

// Optional webhook receiver for Hikvision pushes.
// Primary ingestion is the polling loop in `lib/scanner-sync.ts` triggered by
// `instrumentation.ts`. This route exists so you can:
//   - test the write path with curl
//   - back the polling with HTTP push if you ever configure Hikvision's HTTP
//     Listening (events would be deduped against the partial unique index)
//
// Hikvision payload (shape varies by firmware):
//   { ipAddress, AccessControllerEvent: { employeeNoString, time, serialNo, ... } }
// or:
//   { Events: [ { ipAddress, AccessControllerEvent: { ... } }, ... ] }

export const dynamic = "force-dynamic";

interface AccessControllerEvent {
  employeeNoString?: string;
  name?: string;
  time?: string;
  serialNo?: number | string;
  major?: number;
  minor?: number;
}

interface HikvisionEvent {
  ipAddress?: string;
  AccessControllerEvent?: AccessControllerEvent;
}

interface HikvisionPayload extends HikvisionEvent {
  Events?: HikvisionEvent[];
}

type ProcessResult =
  | { ok: true; status: "inserted" | "duplicate" }
  | { ok: false; reason: string };

async function processEvent(
  ipAddress: string | undefined,
  empNoStr: string | undefined,
  scanTimeStr: string | undefined,
  serialNoRaw: number | string | undefined,
): Promise<ProcessResult> {
  if (!ipAddress) return { ok: false, reason: "missing ipAddress" };
  if (!empNoStr || empNoStr === "0") {
    return { ok: false, reason: "missing employeeNoString" };
  }

  const device = await prisma.devices.findFirst({
    where: { ip_address: ipAddress },
    select: { device_id: true, branch_id: true },
  });
  if (!device) {
    return { ok: false, reason: `no device row for ip=${ipAddress}` };
  }

  // employee_id on `employment` is the Hikvision employeeNoString
  const employment = await prisma.employment.findFirst({
    where: { employee_id: empNoStr },
    orderBy: { employment_id: "desc" },
    select: { user_id: true },
  });
  if (!employment) {
    return { ok: false, reason: `no employment for employee_id=${empNoStr}` };
  }

  const scanTime = scanTimeStr ? new Date(scanTimeStr) : new Date();
  if (Number.isNaN(scanTime.getTime())) {
    return { ok: false, reason: "invalid scan time" };
  }

  const serial = serialNoRaw != null ? String(serialNoRaw) : null;
  const date = mytDateOnly(scanTime);

  // 1. Insert log row. Idempotent via partial unique on (device_id, scan_serial).
  //    Prisma can't address partial uniques in upsert/findUnique, so use raw SQL.
  let logId: number | null = null;
  if (serial) {
    const inserted = await prisma.$queryRaw<Array<{ log_id: number }>>`
      INSERT INTO attendance_log (user_id, scan_time, scan_type, device_id, scan_serial)
      VALUES (${employment.user_id}, ${scanTime}, 'scan', ${device.device_id}, ${serial})
      ON CONFLICT (device_id, scan_serial) WHERE scan_serial IS NOT NULL
      DO NOTHING
      RETURNING log_id
    `;
    logId = inserted[0]?.log_id ?? null;
  } else {
    const created = await prisma.attendance_log.create({
      data: {
        user_id: employment.user_id,
        scan_time: scanTime,
        scan_type: "scan",
        device_id: device.device_id,
      },
      select: { log_id: true },
    });
    logId = created.log_id;
  }

  // Duplicate scan — partial unique caught it, nothing else to do.
  if (logId === null) return { ok: true, status: "duplicate" };

  // 2. Recompute attendance from all logs that day. Always-correct, idempotent,
  //    and tolerant of out-of-order webhook delivery.
  const { start, end } = mytDayUtcBounds(scanTime);
  const dayAgg = await prisma.attendance_log.aggregate({
    where: {
      user_id: employment.user_id,
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
    where: { user_id_date: { user_id: employment.user_id, date } },
    create: {
      user_id: employment.user_id,
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

  // 3. Link the log row back to its attendance row.
  await prisma.attendance_log.update({
    where: { log_id: logId },
    data: { attendance_id: upserted.attendance_id },
  });

  // 4. Re-tag scan_type so the row is self-describing in the DB.
  await prisma.$executeRaw`
    WITH ranked AS (
      SELECT
        log_id,
        ROW_NUMBER() OVER (ORDER BY scan_time ASC) AS rn,
        COUNT(*) OVER () AS total
      FROM attendance_log
      WHERE user_id = ${employment.user_id}
        AND scan_time >= ${start}
        AND scan_time <  ${end}
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

  return { ok: true, status: "inserted" };
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: HikvisionPayload;
  try {
    body = (await request.json()) as HikvisionPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const events: HikvisionEvent[] = body.Events ?? [body];
  const results: ProcessResult[] = [];
  try {
    for (const event of events) {
      const ip = event.ipAddress ?? body.ipAddress;
      const ace = event.AccessControllerEvent ?? body.AccessControllerEvent;
      if (!ace) {
        results.push({ ok: false, reason: "no AccessControllerEvent" });
        continue;
      }
      results.push(
        await processEvent(ip, ace.employeeNoString, ace.time, ace.serialNo),
      );
    }
  } catch (err) {
    console.error("[scanner-webhook] write failed:", err);
    return NextResponse.json({ error: "Write failed" }, { status: 500 });
  }

  const failures = results.filter((r): r is { ok: false; reason: string } => !r.ok);
  if (failures.length > 0) {
    console.warn("[scanner-webhook] partial failures:", failures);
  }

  return NextResponse.json({ ok: true, results });
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: "scanner-webhook ready",
    time: new Date().toISOString(),
  });
}
