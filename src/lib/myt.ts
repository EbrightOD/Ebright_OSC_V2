// MYT (Asia/Kuala_Lumpur, UTC+8) date helpers.
//
// Postgres `@db.Date` stores a calendar date with no timezone; Prisma serialises
// a JS Date by sending its UTC YYYY-MM-DD portion. To make a `@db.Date` column
// hold the MYT calendar date, pass a Date whose UTC YYYY-MM-DD matches MYT.
//
// Postgres `@db.Timestamptz` stores a UTC instant. To filter by an MYT day,
// pass real UTC instants of that MYT day's [00:00, next-00:00).

export const MYT_OFFSET_MS = 8 * 60 * 60_000;

// Date with UTC YYYY-MM-DD matching the MYT calendar date of `d`. Use for
// reading/writing `attendance.date` and other `@db.Date` columns.
export function mytDateOnly(d: Date = new Date()): Date {
  const myt = new Date(d.getTime() + MYT_OFFSET_MS);
  return new Date(
    Date.UTC(myt.getUTCFullYear(), myt.getUTCMonth(), myt.getUTCDate()),
  );
}

// Real UTC instants of MYT-day [start, end) for the MYT date that contains `d`.
// Use for filtering `@db.Timestamptz` columns like `attendance_log.scan_time`.
export function mytDayUtcBounds(d: Date = new Date()): { start: Date; end: Date } {
  const myt = new Date(d.getTime() + MYT_OFFSET_MS);
  const startMs =
    Date.UTC(myt.getUTCFullYear(), myt.getUTCMonth(), myt.getUTCDate()) -
    MYT_OFFSET_MS;
  return { start: new Date(startMs), end: new Date(startMs + 24 * 3600_000) };
}

// MYT clock hour (0-23) of a UTC instant.
export function mytHour(d: Date): number {
  return (d.getUTCHours() + 8) % 24;
}

// Format `d` as an ISO-like string in MYT local time, e.g.
// "2025-04-12T08:31:00+08:00". Hikvision ISAPI expects this format.
export function mytIsoLocal(d: Date): string {
  const myt = new Date(d.getTime() + MYT_OFFSET_MS);
  const Y = myt.getUTCFullYear();
  const M = String(myt.getUTCMonth() + 1).padStart(2, "0");
  const D = String(myt.getUTCDate()).padStart(2, "0");
  const h = String(myt.getUTCHours()).padStart(2, "0");
  const m = String(myt.getUTCMinutes()).padStart(2, "0");
  const s = String(myt.getUTCSeconds()).padStart(2, "0");
  return `${Y}-${M}-${D}T${h}:${m}:${s}+08:00`;
}
