import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { prisma } from "@/lib/prisma";
import { mytDateOnly, mytHour } from "@/lib/myt";
import { getMalaysiaHoliday, isMalaysiaHoliday } from "@/lib/malaysiaHolidays";

export const dynamic = "force-dynamic";

const STAFF_ROLE_ID = 4;
const LATE_HOUR_MYT = 9; // strictly after 09:00 MYT counts as late

// Schedule definitions per branch. Keyed by branch_code.
// HQ:    Tue–Sat, 09:00 → 18:00 (Sat → 19:00).
// Other: Mon–Sat, 09:00 → 18:00 (default for branches we haven't tuned).
type DaySchedule = { startHour: number; endHour: number };
type Schedule    = { workingDows: number[]; perDow: Record<number, DaySchedule> };

// JS getUTCDay(): 0=Sun, 1=Mon, 2=Tue, ..., 6=Sat
const HQ_SCHEDULE: Schedule = {
  workingDows: [2, 3, 4, 5, 6],
  perDow: {
    2: { startHour: 9, endHour: 18 },
    3: { startHour: 9, endHour: 18 },
    4: { startHour: 9, endHour: 18 },
    5: { startHour: 9, endHour: 18 },
    6: { startHour: 9, endHour: 19 },
  },
};

const DEFAULT_SCHEDULE: Schedule = {
  workingDows: [1, 2, 3, 4, 5, 6],
  perDow: {
    1: { startHour: 9, endHour: 18 },
    2: { startHour: 9, endHour: 18 },
    3: { startHour: 9, endHour: 18 },
    4: { startHour: 9, endHour: 18 },
    5: { startHour: 9, endHour: 18 },
    6: { startHour: 9, endHour: 18 },
  },
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Count working days in [start, end] inclusive: days in the schedule's
// `workingDows` that are NOT a Malaysian public holiday.
function workingDaysBetween(start: Date, end: Date, sch: Schedule): number {
  let count = 0;
  const d = new Date(start.getTime());
  while (d.getTime() <= end.getTime()) {
    const iso = d.toISOString().slice(0, 10);
    if (sch.workingDows.includes(d.getUTCDay()) && !isMalaysiaHoliday(iso)) {
      count++;
    }
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return count;
}

// Hours worked for an attendance row. Prefers `total_hours`; falls back to
// (check_out − check_in) when the column is null but both stamps exist.
function hoursFromRow(row: { check_in: Date | null; check_out: Date | null; total_hours: unknown }): number {
  const th = row.total_hours;
  if (th !== null && th !== undefined) {
    const n = Number(th);
    if (!isNaN(n) && n > 0) return n;
  }
  if (row.check_in && row.check_out) {
    const ms = row.check_out.getTime() - row.check_in.getTime();
    if (ms > 0) return ms / 3_600_000;
  }
  return 0;
}

// Format an MYT-anchored Date as the wall-clock time, e.g. "9:14 AM".
function fmtMytClock(d: Date): string {
  const mytMs = d.getTime() + 8 * 60 * 60_000;
  const m = new Date(mytMs);
  let h = m.getUTCHours();
  const mm = m.getUTCMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12; if (h === 0) h = 12;
  return `${h}:${String(mm).padStart(2, "0")} ${ampm}`;
}

// Minutes a check_in is after the scheduled startHour (negative → early).
function minutesLate(checkIn: Date, startHour: number): number {
  const mytMs = checkIn.getTime() + 8 * 60 * 60_000;
  const m = new Date(mytMs);
  const totalMin   = m.getUTCHours() * 60 + m.getUTCMinutes();
  const startMin   = startHour * 60;
  return totalMin - startMin;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const me = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: {
      user_id:    true,
      role_id:    true,
      email:      true,
      created_at: true,
      user_profile: { select: { full_name: true, nick_name: true } },
      employment: {
        orderBy: { employment_id: "desc" },
        take: 1,
        select: {
          employee_id: true,
          position:    true,
          start_date:  true,
          branch:     { select: { branch_name: true, branch_code: true } },
          department: { select: { department_name: true } },
        },
      },
    },
  });

  if (!me) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  const employment = me.employment[0];
  const branchCode = employment?.branch?.branch_code ?? null;
  const sch = branchCode === "HQ" ? HQ_SCHEDULE : DEFAULT_SCHEDULE;

  // Calendar bounds (MYT @db.Date space).
  const today      = mytDateOnly();
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(),     1));
  const lastMStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
  const lastMEnd   = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(),     0));

  // Current ISO-week range (Mon..Sun) containing `today`.
  const dow         = today.getUTCDay();           // 0=Sun..6=Sat
  const daysFromMon = dow === 0 ? 6 : dow - 1;
  const weekStart   = new Date(today.getTime()); weekStart.setUTCDate(today.getUTCDate() - daysFromMon);
  const weekEnd     = new Date(weekStart.getTime()); weekEnd.setUTCDate(weekStart.getUTCDate() + 6);

  const [attMonth, attLast, attWeek, pendingLeaveAgg] = await Promise.all([
    prisma.attendance.findMany({
      where: { user_id: me.user_id, date: { gte: monthStart, lte: today } },
      select: { date: true, check_in: true, check_out: true, total_hours: true },
    }),
    prisma.attendance.findMany({
      where: { user_id: me.user_id, date: { gte: lastMStart, lte: lastMEnd } },
      select: { check_in: true },
    }),
    prisma.attendance.findMany({
      where: { user_id: me.user_id, date: { gte: weekStart, lte: weekEnd } },
      select: { date: true, check_in: true, check_out: true, total_hours: true },
    }),
    prisma.leave_request.aggregate({
      where: { user_id: me.user_id, status: "pending" },
      _sum:  { total_days: true },
    }),
  ]);

  // ── Monthly KPIs ────────────────────────────────────────────────────────────
  const elapsedWorking   = workingDaysBetween(monthStart, today,    sch);
  const lastMonthWorking = workingDaysBetween(lastMStart, lastMEnd, sch);

  const presentThis = attMonth.filter(a => a.check_in).length;
  const presentLast = attLast.filter(a => a.check_in).length;

  const thisMonthPercent = elapsedWorking   > 0 ? Math.min(100, Math.round((presentThis / elapsedWorking)   * 100)) : 0;
  const lastMonthPercent = lastMonthWorking > 0 ? Math.min(100, Math.round((presentLast / lastMonthWorking) * 100)) : 0;

  const lateThisMonth = attMonth.filter(a => a.check_in && mytHour(a.check_in) >= LATE_HOUR_MYT).length;

  let overtimeHrs = 0;
  for (const a of attMonth) {
    const hrs = hoursFromRow(a);
    if (hrs > 8) overtimeHrs += hrs - 8;
  }
  overtimeHrs = Math.round(overtimeHrs * 10) / 10;

  // ── This-week breakdown (only working days for the user's schedule) ────────
  const weekAttMap = new Map<string, { check_in: Date | null; check_out: Date | null; total_hours: unknown }>();
  for (const a of attWeek) {
    const key = a.date.toISOString().slice(0, 10);
    weekAttMap.set(key, { check_in: a.check_in, check_out: a.check_out, total_hours: a.total_hours });
  }

  type WeekDay = {
    day:      string;
    dateIso:  string;
    state:    "ontime" | "late" | "today" | "absent" | "upcoming" | "holiday";
    label:    string;
    minutesLate?: number;
  };

  const weekDays: WeekDay[] = [];
  let totalWeekHours = 0;
  let onTimeWeek  = 0;
  let lateWeek    = 0;
  let absentWeek  = 0;
  let holidayWeek = 0;

  const cur = new Date(weekStart.getTime());
  while (cur.getTime() <= weekEnd.getTime()) {
    const cDow = cur.getUTCDay();
    if (sch.workingDows.includes(cDow)) {
      const iso         = cur.toISOString().slice(0, 10);
      const holidayName = getMalaysiaHoliday(iso);
      const cmpToday    = cur.getTime() === today.getTime();
      const future      = cur.getTime() >  today.getTime();
      const att         = weekAttMap.get(iso);

      const startHour = sch.perDow[cDow]?.startHour ?? 9;

      let state: WeekDay["state"];
      let label: string;
      let minsLate: number | undefined;

      if (holidayName) {
        // Public holiday — keep any check-in hours but never count as absent/late.
        state = "holiday";
        label = holidayName;
        holidayWeek++;
        if (att) totalWeekHours += hoursFromRow(att);
      } else if (att?.check_in) {
        const mins  = minutesLate(att.check_in, startHour);
        const clock = fmtMytClock(att.check_in);
        if (mins > 0) {
          state = "late";
          minsLate = mins;
          label = `Late ${mins}m · ${clock}`;
          lateWeek++;
        } else {
          state = "ontime";
          label = `On time · ${clock}`;
          onTimeWeek++;
        }
        totalWeekHours += hoursFromRow(att);
      } else if (cmpToday) {
        state = "today";
        label = "Today";
      } else if (future) {
        state = "upcoming";
        label = DAY_NAMES[cDow];
      } else {
        state = "absent";
        label = "Absent";
        absentWeek++;
      }

      weekDays.push({ day: DAY_NAMES[cDow], dateIso: iso, state, label, minutesLate: minsLate });
    }
    cur.setUTCDate(cur.getUTCDate() + 1);
  }

  // Working days elapsed this week up to & including today.
  const elapsedWeekDays = workingDaysBetween(weekStart, today, sch);
  const weekOnTimePercent = elapsedWeekDays > 0
    ? Math.round((onTimeWeek / elapsedWeekDays) * 100)
    : 0;

  const pendingLeaveDays = Number(pendingLeaveAgg._sum.total_days ?? 0);

  return NextResponse.json({
    success: true,
    isEmployee: me.role_id === STAFF_ROLE_ID,
    viewer: {
      fullName:   me.user_profile?.full_name ?? null,
      nickName:   me.user_profile?.nick_name ?? null,
      email:      me.email,
      employeeId: employment?.employee_id  ?? null,
      position:   employment?.position     ?? null,
      branchName: employment?.branch?.branch_name ?? null,
      branchCode,
      department: employment?.department?.department_name ?? null,
      startDate:  employment?.start_date   ?? null,
      createdAt:  me.created_at,
    },
    attendance: {
      thisMonthPercent,
      lastMonthPercent,
      delta:         thisMonthPercent - lastMonthPercent,
      lateThisMonth,
    },
    week: {
      rangeStart:    weekStart.toISOString().slice(0, 10),
      rangeEnd:      weekEnd.toISOString().slice(0, 10),
      onTimePercent: weekOnTimePercent,
      onTimeCount:   onTimeWeek,
      lateCount:     lateWeek,
      absentCount:   absentWeek,
      holidayCount:  holidayWeek,
      totalHours:    Math.round(totalWeekHours * 10) / 10,
      days:          weekDays,
    },
    leave:    { pendingDays: pendingLeaveDays },
    overtime: { thisMonthHours: overtimeHrs },
  });
}
