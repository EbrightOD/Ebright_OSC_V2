// Attendance Report is the historical companion to /attendance/summary:
// SAME data shape, SAME view component, just rendered against a selected
// historical date (and without the live auto-refresh implications).
//
// The view component renders date / branch pickers and the Justify modal,
// so this page is essentially the same data-fetch as summary/page.tsx —
// kept duplicated rather than abstracted because the two pages will diverge
// (e.g. Report-only features like monthly export, justify-batch view, etc.).

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { queryEbrightHrfs } from "@/lib/ebright-hrfs";
import { mytDayUtcBounds } from "@/lib/myt";
import AppShell from "@/app/components/AppShell";
import AttendanceSummaryView, {
  type SummaryData,
  type AttendanceRow,
  type BranchOption,
  type AbsenceKind,
} from "@/app/components/AttendanceSummaryView";
import { ShieldAlert } from "lucide-react";
import {
  getResolvedSchedulesForDate,
  type WeeklySchedule,
} from "@/lib/schedule-history";
import { assignedBranchOnDay, rotationFor } from "@/lib/staff-rotation";

const MIA_LEAVE_CODE = "UL";

export const dynamic = "force-dynamic";

const ALLOWED_ROLE_TYPES = new Set(["superadmin", "ceo", "hr"]);
const LATE_GRACE_MINUTES = 1;
const SCANNER_ONLINE_WINDOW_MIN = 10;

const DAY_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
type DayKey = (typeof DAY_KEYS)[number];

function deviceBranchCode(deviceName: string | null): string | null {
  if (!deviceName) return null;
  const lower = deviceName.toLowerCase();
  if (lower.includes("scanner main") || lower.startsWith("hq ")) return "HQ";
  if (lower.includes("scanner st")) return "ST";
  return null;
}

interface PageProps {
  searchParams: Promise<{ branch?: string; date?: string }>;
}

function parseMytDate(iso: string | undefined): Date {
  if (!iso) return new Date();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return new Date();
  const [, y, mo, d] = m;
  return new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), 4, 0, 0));
}
function formatMytIsoDate(d: Date): string {
  const myt = new Date(d.getTime() + 8 * 60 * 60_000);
  return `${myt.getUTCFullYear()}-${String(myt.getUTCMonth() + 1).padStart(2, "0")}-${String(myt.getUTCDate()).padStart(2, "0")}`;
}
function dayKeyForMytDate(d: Date): DayKey {
  const myt = new Date(d.getTime() + 8 * 60 * 60_000);
  return DAY_KEYS[myt.getUTCDay()];
}
function utcToMytHm(d: Date): string {
  const myt = new Date(d.getTime() + 8 * 60 * 60_000);
  return `${String(myt.getUTCHours()).padStart(2, "0")}:${String(myt.getUTCMinutes()).padStart(2, "0")}`;
}
function classifyLate(
  scanMytHm: string,
  scheduledStart: string,
  graceMin: number,
): "late" | "on_time" {
  const ms = /^(\d{2}):(\d{2})/.exec(scheduledStart);
  const mc = /^(\d{2}):(\d{2})/.exec(scanMytHm);
  if (!ms || !mc) return "on_time";
  const startMin = Number(ms[1]) * 60 + Number(ms[2]);
  const clockMin = Number(mc[1]) * 60 + Number(mc[2]);
  return clockMin > startMin + graceMin ? "late" : "on_time";
}
function classifyEarly(
  scanMytHm: string,
  scheduledEnd: string,
): "early" | "normal" {
  const me = /^(\d{2}):(\d{2})/.exec(scheduledEnd);
  const mc = /^(\d{2}):(\d{2})/.exec(scanMytHm);
  if (!me || !mc) return "normal";
  const endMin = Number(me[1]) * 60 + Number(me[2]);
  const clockMin = Number(mc[1]) * 60 + Number(mc[2]);
  return clockMin < endMin ? "early" : "normal";
}

interface LocalStaffRow {
  id: number;
  user_id: number;
  name: string | null;
  branch: string | null;
  role: string | null;
  position: string | null;
  department: string | null;
  location: string | null;
  employeeId: string | null;
  workingHours: Record<string, { start: string; end: string } | null> | null;
}

interface AggregatedScan {
  emp_no: string;
  first_event: Date;
  last_event: Date;
  scan_count: number;
  sample_device_name: string | null;
}

export default async function AttendanceReportPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const me = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { role: { select: { role_type: true } } },
  });

  const userEmail = session.user.email;
  const userName = session.user.name ?? null;
  const userRole = (session.user as { role?: string } | undefined)?.role ?? "USER";

  const roleType = me?.role?.role_type?.toLowerCase() ?? "";
  if (!ALLOWED_ROLE_TYPES.has(roleType)) {
    return (
      <AppShell email={userEmail} role={userRole} name={userName}>
        <div className="min-h-full bg-slate-50 flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mb-5">
              <ShieldAlert className="w-7 h-7 text-rose-600" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-semibold text-slate-900">Restricted Access</h1>
            <p className="mt-2 text-sm text-slate-600">
              The attendance report is available to HR, CEO, and superadmin roles only.
            </p>
            <Link
              href="/attendance"
              className="mt-6 inline-flex items-center h-10 px-4 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
            >
              Back to Attendance
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const sp = await searchParams;
  const refDate = parseMytDate(sp.date);
  const selectedDate = formatMytIsoDate(refDate);
  const dayKey = dayKeyForMytDate(refDate);
  const { start: dayStart, end: dayEnd } = mytDayUtcBounds(refDate);

  // ── Reuse the same data layer as the Summary. Kept duplicated rather than
  //    factored into a shared helper so Report-only tweaks (e.g. CSV export)
  //    don't require touching Summary.
  const branches = await prisma.branch.findMany({
    select: { branch_id: true, branch_name: true, branch_code: true },
    orderBy: { branch_name: "asc" },
  });
  const branchOptions: BranchOption[] = branches.map((b) => ({
    branch_id: b.branch_id,
    branch_name: b.branch_name,
    branch_code: b.branch_code,
  }));

  const requestedBranchId =
    sp.branch && sp.branch !== "all" ? Number(sp.branch) : NaN;
  const selectedBranch = Number.isFinite(requestedBranchId)
    ? branchOptions.find((b) => b.branch_id === requestedBranchId) ?? null
    : null;
  const branchCode = selectedBranch?.branch_code ?? null;

  // Active employments (local source of truth)
  const employmentRows = await prisma.employment.findMany({
    where: {
      status: "active",
      employee_id: { not: null },
      users: { status: "active", deleted_at: null },
    },
    select: {
      employment_id: true,
      user_id: true,
      employee_id: true,
      position: true,
      working_hours_json: true,
      branch: { select: { branch_code: true, location: true } },
      department: { select: { department_name: true } },
      users: {
        select: {
          role: { select: { role_type: true } },
          user_profile: { select: { full_name: true } },
        },
      },
    },
  });
  const allStaff: LocalStaffRow[] = employmentRows.map((e) => ({
    id: e.employment_id,
    user_id: e.user_id,
    name: e.users.user_profile?.full_name ?? null,
    branch: e.branch?.branch_code ?? null,
    role: e.users.role?.role_type ?? null,
    position: e.position ?? null,
    department: e.department?.department_name ?? null,
    location: e.branch?.location ?? null,
    employeeId: e.employee_id,
    workingHours:
      (e.working_hours_json as Record<string, { start: string; end: string } | null> | null) ?? null,
  }));
  allStaff.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
  const staffByEmpNo = new Map<string, LocalStaffRow>();
  for (const s of allStaff) {
    if (s.employeeId) staffByEmpNo.set(s.employeeId, s);
  }

  const schedulesByDate = await getResolvedSchedulesForDate(selectedDate);

  function resolvedDayScheduleFor(s: LocalStaffRow): WeeklySchedule | null {
    if (s.id in schedulesByDate) return schedulesByDate[s.id];
    return (s.workingHours as WeeklySchedule | null) ?? null;
  }

  const scheduledStaff: Array<{
    staff: LocalStaffRow;
    schedule: { start: string; end: string };
    branchForDay: string | null;
  }> = [];
  for (const s of allStaff) {
    const resolved = resolvedDayScheduleFor(s);
    const day = resolved?.[dayKey] ?? null;
    if (!day) continue;
    const rotationBranch = assignedBranchOnDay(s.employeeId, dayKey);
    const branchForDay = rotationBranch ?? s.branch ?? null;
    if (branchCode && branchForDay !== branchCode) continue;
    scheduledStaff.push({ staff: s, schedule: day, branchForDay });
  }

  // ── HRFS: hikvision scans aggregated per person ─────────────────────────
  const aggResult = await queryEbrightHrfs<{
    emp_no: string;
    first_event: Date;
    last_event: Date;
    scan_count: string;
    sample_device_name: string | null;
  }>(
    `WITH events AS (
       SELECT COALESCE(m.true_id, h.person_id) AS emp_no, h.event_time, h.device_name
       FROM public.hikvision_attendance_all h
       LEFT JOIN public.hikvision_id_map m ON m.wrong_id = h.person_id
       WHERE h.event_time >= $1 AND h.event_time < $2
     )
     SELECT emp_no, MIN(event_time) AS first_event, MAX(event_time) AS last_event,
            COUNT(*)::text AS scan_count,
            (array_agg(device_name ORDER BY event_time))[1] AS sample_device_name
     FROM events WHERE emp_no IS NOT NULL GROUP BY emp_no`,
    [dayStart.toISOString(), dayEnd.toISOString()],
  );
  const aggregated: AggregatedScan[] = aggResult.rows.map((r) => ({
    emp_no: r.emp_no,
    first_event: r.first_event instanceof Date ? r.first_event : new Date(r.first_event),
    last_event: r.last_event instanceof Date ? r.last_event : new Date(r.last_event),
    scan_count: Number(r.scan_count) || 0,
    sample_device_name: r.sample_device_name,
  }));
  const scanByEmpNo = new Map<string, AggregatedScan>();
  for (const s of aggregated) scanByEmpNo.set(s.emp_no, s);

  const liveResult = await queryEbrightHrfs<{ last_event: Date | null; total: string }>(
    `SELECT MAX(event_time) AS last_event, COUNT(*)::text AS total
       FROM public.hikvision_attendance_all
      WHERE event_time >= $1 AND event_time < $2`,
    [dayStart.toISOString(), dayEnd.toISOString()],
  );
  const lastEventRaw = liveResult.rows[0]?.last_event ?? null;
  const lastScanTs = lastEventRaw
    ? lastEventRaw instanceof Date ? lastEventRaw : new Date(lastEventRaw)
    : null;
  const recordsToday = Number(liveResult.rows[0]?.total ?? 0);
  const scannerOnline = lastScanTs
    ? Date.now() - lastScanTs.getTime() < SCANNER_ONLINE_WINDOW_MIN * 60_000
    : false;

  // Leave records
  const leaveResult = await queryEbrightHrfs<{
    employee_code: string | null;
    employee_name: string | null;
    leave_type_code: string | null;
  }>(
    `SELECT "EmployeeCode" AS employee_code, "EmployeeName" AS employee_name,
            "LeaveTypeCode" AS leave_type_code
       FROM public."LeaveTransaction"
      WHERE "LeaveDate" = $1::date`,
    [selectedDate],
  );
  const leaveByEmpCode = new Map<string, { code: string | null; name: string | null }>();
  const leaveByName = new Map<string, { code: string | null; name: string | null }>();
  for (const r of leaveResult.rows) {
    const entry = { code: r.leave_type_code, name: null };
    if (r.employee_code) leaveByEmpCode.set(r.employee_code, entry);
    if (r.employee_name) leaveByName.set(r.employee_name.trim().toLowerCase(), entry);
  }
  function leaveFor(staff: LocalStaffRow) {
    if (staff.employeeId) {
      const byCode = leaveByEmpCode.get(staff.employeeId);
      if (byCode) return byCode;
    }
    if (staff.name) {
      const byName = leaveByName.get(staff.name.trim().toLowerCase());
      if (byName) return byName;
    }
    return null;
  }

  // Justifications
  const justifications = await prisma.attendance_justification.findMany({
    where: { date: new Date(selectedDate + "T00:00:00Z") },
    select: { id: true, user_id: true, reason_category: true, note: true },
  });
  const justificationByUser = new Map<number, { id: number; reason: string; note: string | null }>();
  for (const j of justifications) {
    justificationByUser.set(j.user_id, { id: j.id, reason: j.reason_category, note: j.note });
  }

  const scheduledEmpNos = new Set<string>();
  const expectedRows: AttendanceRow[] = scheduledStaff.map(({ staff: s, schedule: sched, branchForDay }) => {
    if (s.employeeId) scheduledEmpNos.add(s.employeeId);
    const scan = s.employeeId ? scanByEmpNo.get(s.employeeId) ?? null : null;
    const checkInDate = scan?.first_event ?? null;
    const checkOutDate =
      scan && scan.last_event.getTime() > scan.first_event.getTime() ? scan.last_event : null;

    const inStatus: AttendanceRow["in_status"] = checkInDate
      ? classifyLate(utcToMytHm(checkInDate), sched.start, LATE_GRACE_MINUTES)
      : null;
    const outStatus: AttendanceRow["out_status"] = checkOutDate
      ? classifyEarly(utcToMytHm(checkOutDate), sched.end)
      : null;

    let absenceKind: AbsenceKind = null;
    let leaveCode: string | null = null;
    let leaveName: string | null = null;
    const just = justificationByUser.get(s.user_id) ?? null;
    if (!checkInDate && !checkOutDate) {
      if (just) {
        absenceKind = "justified";
        leaveCode = just.reason;
        leaveName = just.note;
      } else {
        const lv = leaveFor(s);
        if (lv) {
          leaveCode = lv.code;
          leaveName = lv.name;
          absenceKind = lv.code === MIA_LEAVE_CODE ? "mia" : "on_leave";
        } else {
          absenceKind = "missing";
        }
      }
    }

    const rotation = rotationFor(s.employeeId);
    const visitingFrom =
      rotation && branchForDay && rotation.homeBranchCode !== branchForDay
        ? rotation.homeBranchCode
        : null;

    return {
      user_id: s.user_id,
      name: s.name ?? s.employeeId ?? `Staff #${s.id}`,
      employee_code: s.employeeId ?? null,
      department: s.department ?? s.location ?? null,
      position: s.position ?? s.role ?? null,
      check_in: checkInDate?.toISOString() ?? null,
      check_out: checkOutDate?.toISOString() ?? null,
      in_status: inStatus,
      out_status: outStatus,
      scans: scan?.scan_count ?? 0,
      home_branch_code: s.branch ?? null,
      visiting_from: visitingFrom,
      absence_kind: absenceKind,
      leave_type_code: leaveCode,
      leave_type_name: leaveName,
      justification: just,
    };
  });

  const visitorRows: AttendanceRow[] = [];
  if (selectedBranch) {
    for (const scan of aggregated) {
      if (scheduledEmpNos.has(scan.emp_no)) continue;
      const staff = staffByEmpNo.get(scan.emp_no) ?? null;
      if (!staff) continue;
      const scannedAtBranch = deviceBranchCode(scan.sample_device_name);
      if (!scannedAtBranch || scannedAtBranch !== branchCode) continue;
      if (staff.branch === branchCode) continue;
      const checkInDate = scan.first_event;
      const checkOutDate =
        scan.last_event.getTime() > scan.first_event.getTime() ? scan.last_event : null;
      visitorRows.push({
        user_id: staff.user_id,
        name: staff.name ?? `Emp ${scan.emp_no}`,
        employee_code: scan.emp_no,
        department: staff.department ?? staff.location ?? null,
        position: staff.position ?? staff.role ?? null,
        check_in: checkInDate.toISOString(),
        check_out: checkOutDate?.toISOString() ?? null,
        in_status: "on_time",
        out_status: checkOutDate ? "normal" : null,
        scans: scan.scan_count,
        home_branch_code: staff.branch ?? null,
        visiting_from: staff.branch ?? "another branch",
        absence_kind: null,
        leave_type_code: null,
        leave_type_name: null,
        justification: null,
      });
    }
  }

  const rows: AttendanceRow[] = [...expectedRows, ...visitorRows];

  const expectedScanned = expectedRows.filter((r) => r.check_in || r.check_out).length;
  const currentlyIn = rows.filter((r) => r.check_in && !r.check_out).length;
  const checkedOut = rows.filter((r) => r.check_in && r.check_out).length;
  const totalEmployees = expectedRows.length;
  const missing   = expectedRows.filter((r) => r.absence_kind === "missing").length;
  const onLeave   = expectedRows.filter((r) => r.absence_kind === "on_leave").length;
  const mia       = expectedRows.filter((r) => r.absence_kind === "mia").length;
  const justified = expectedRows.filter((r) => r.absence_kind === "justified").length;
  const scanned = expectedScanned + visitorRows.length;

  const data: SummaryData = {
    branches: branchOptions,
    selectedBranch,
    selectedDate,
    counts: { scanned, currentlyIn, checkedOut, missing, onLeave, mia, justified, totalEmployees },
    scannerOnline,
    lastSyncedIso: lastScanTs?.toISOString() ?? null,
    recordsToday,
    rows,
    canJustify: ALLOWED_ROLE_TYPES.has(roleType),
  };

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <AttendanceSummaryView data={data} />
    </AppShell>
  );
}
