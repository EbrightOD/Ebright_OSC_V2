import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/app/components/AppShell";
import AttendanceSummaryView, {
  type SummaryData,
  type AttendanceRow,
  type BranchOption,
} from "@/app/components/AttendanceSummaryView";
import { ShieldAlert } from "lucide-react";
import { mytDateOnly, mytDayUtcBounds, mytHour } from "@/lib/myt";

export const dynamic = "force-dynamic";

const ALLOWED_ROLE_TYPES = new Set(["superadmin", "ceo", "hr"]);

// Company schedule (MYT)
const LATE_HOUR_MYT = 9;        // strictly after 09:00 MYT counts as late
const EARLY_OUT_HOUR_MYT = 18;  // strictly before 18:00 MYT counts as early
const SCANNER_ONLINE_WINDOW_MIN = 10; // any log in last N minutes ⇒ online

// CEO is company-wide leadership — if their employment row has no branch, treat
// HQ as their home so they don't show as "visiting another branch" everywhere.
const CEO_ROLE_ID = 2;
const CEO_HOME_BRANCH_CODE = "HQ";
const CEO_HOME_BRANCH_NAME = "HQ";

interface PageProps {
  searchParams: Promise<{ branch?: string }>;
}

export default async function AttendanceSummaryPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const me = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: {
      user_id: true,
      email: true,
      role: { select: { role_type: true } },
    },
  });

  const userEmail = session.user.email;
  const userName = session.user.name ?? null;
  const userRole = (session.user as { role?: string } | undefined)?.role ?? "USER";

  const roleType = me?.role?.role_type?.toLowerCase() ?? "";
  const allowed = ALLOWED_ROLE_TYPES.has(roleType);

  if (!allowed) {
    return (
      <AppShell email={userEmail} role={userRole} name={userName}>
        <div className="min-h-full bg-slate-50 flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mb-5">
              <ShieldAlert className="w-7 h-7 text-rose-600" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-semibold text-slate-900">
              Restricted Access
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              The attendance summary is available to HR, CEO, and superadmin roles
              only.
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
  const today = mytDateOnly();                          // for attendance.date (@db.Date)
  const { start: dayStart, end: dayEnd } = mytDayUtcBounds(); // for scan_time (@db.Timestamptz)

  // All branches — used for the dropdown and for resolving home_branch_code
  const branches = await prisma.branch.findMany({
    select: { branch_id: true, branch_name: true, branch_code: true },
    orderBy: { branch_name: "asc" },
  });

  const branchOptions: BranchOption[] = branches.map((b) => ({
    branch_id: b.branch_id,
    branch_name: b.branch_name,
    branch_code: b.branch_code,
  }));

  // Default landing view = All branches. ?branch=<id> drills into one.
  const requestedBranchId =
    sp.branch && sp.branch !== "all" ? Number(sp.branch) : NaN;
  const selectedBranch = Number.isFinite(requestedBranchId)
    ? branchOptions.find((b) => b.branch_id === requestedBranchId) ?? null
    : null;
  const isAllBranches = selectedBranch === null;

  // Active employees in scope.
  // Scope: role_id 2 (CEO) or 4 (employee) — both clock attendance.
  // Plus at least one employment row with a non-null employee_id (and matching
  // the selected branch when one is chosen).
  const employees = await prisma.users.findMany({
    where: {
      status: "active",
      deleted_at: null,
      role_id: { in: [2, 4] },
      employment: selectedBranch
        ? {
            some: {
              branch_id: selectedBranch.branch_id,
              employee_id: { not: null },
            },
          }
        : { some: { employee_id: { not: null } } },
    },
    select: {
      user_id: true,
      role_id: true,
      user_profile: { select: { full_name: true } },
      employment: {
        where: selectedBranch
          ? {
              branch_id: selectedBranch.branch_id,
              employee_id: { not: null },
            }
          : { employee_id: { not: null } },
        take: 1,
        orderBy: { employment_id: "desc" },
        select: {
          employee_id: true,
          position: true,
          department: { select: { department_name: true } },
          branch: { select: { branch_code: true } },
        },
      },
    },
    orderBy: { user_id: "asc" },
  });

  const employeeIds = employees.map((e) => e.user_id);
  const expectedSet = new Set(employeeIds);

  // Today's attendance + log activity for assigned employees + branch device list
  const [attendanceToday, logsToday, devices] = await Promise.all([
    employeeIds.length
      ? prisma.attendance.findMany({
          where: {
            user_id: { in: employeeIds },
            date: today,
          },
          select: {
            user_id: true,
            check_in: true,
            check_out: true,
          },
        })
      : Promise.resolve([]),
    employeeIds.length
      ? prisma.attendance_log.groupBy({
          by: ["user_id"],
          where: {
            user_id: { in: employeeIds },
            scan_time: { gte: dayStart, lt: dayEnd },
          },
          _count: { _all: true },
          _max: { scan_time: true },
        })
      : Promise.resolve(
          [] as Array<{
            user_id: number;
            _count: { _all: number };
            _max: { scan_time: Date | null };
          }>,
        ),
    selectedBranch
      ? prisma.devices.findMany({
          where: { branch_id: selectedBranch.branch_id },
          select: { device_id: true },
        })
      : Promise.resolve([] as Array<{ device_id: number }>),
  ]);

  const attMap = new Map(attendanceToday.map((a) => [a.user_id, a]));
  const logCountMap = new Map(
    logsToday.map((l) => [l.user_id, l._count._all]),
  );

  // Scan stats: scoped to this branch's devices when one is selected; global
  // (all devices) in all-branches mode. Visitor detection is branch-only.
  const deviceIds = devices.map((d) => d.device_id);
  const scanScopeFilter = selectedBranch
    ? deviceIds.length
      ? { device_id: { in: deviceIds } }
      : { device_id: { in: [-1] } } // selected branch has no devices → match nothing
    : {}; // all branches → no device filter

  const [branchLogAgg, lastBranchScan, branchLogsToday] = await Promise.all([
    prisma.attendance_log.aggregate({
      where: {
        ...scanScopeFilter,
        scan_time: { gte: dayStart, lt: dayEnd },
      },
      _count: { _all: true },
    }),
    prisma.attendance_log.findFirst({
      where: scanScopeFilter,
      orderBy: { scan_time: "desc" },
      select: { scan_time: true },
    }),
    selectedBranch && deviceIds.length
      ? prisma.attendance_log.findMany({
          where: {
            device_id: { in: deviceIds },
            scan_time: { gte: dayStart, lt: dayEnd },
          },
          select: { user_id: true, scan_time: true },
        })
      : Promise.resolve([] as Array<{ user_id: number; scan_time: Date }>),
  ]);

  const recordsToday = branchLogAgg._count._all ?? 0;
  const lastSyncedIso = lastBranchScan?.scan_time?.toISOString() ?? null;
  const scannerOnline = lastBranchScan?.scan_time
    ? Date.now() - lastBranchScan.scan_time.getTime() <
      SCANNER_ONLINE_WINDOW_MIN * 60_000
    : false;

  // Aggregate today's scans at this branch by user_id (first/last/count)
  type BranchScanInfo = { min: Date; max: Date; count: number };
  const branchScansByUser = new Map<number, BranchScanInfo>();
  for (const log of branchLogsToday) {
    const existing = branchScansByUser.get(log.user_id);
    if (!existing) {
      branchScansByUser.set(log.user_id, {
        min: log.scan_time,
        max: log.scan_time,
        count: 1,
      });
    } else {
      if (log.scan_time < existing.min) existing.min = log.scan_time;
      if (log.scan_time > existing.max) existing.max = log.scan_time;
      existing.count++;
    }
  }

  // Visitors: scanned at this branch today but NOT assigned to it
  const visitorIds = [...branchScansByUser.keys()].filter(
    (id) => !expectedSet.has(id),
  );

  const visitors = visitorIds.length
    ? await prisma.users.findMany({
        where: { user_id: { in: visitorIds } },
        select: {
          user_id: true,
          role_id: true,
          user_profile: { select: { full_name: true } },
          employment: {
            take: 1,
            orderBy: { employment_id: "desc" },
            select: {
              employee_id: true,
              position: true,
              department: { select: { department_name: true } },
              branch: { select: { branch_name: true, branch_code: true } },
            },
          },
        },
      })
    : [];

  // Build rows: expected first, then visitors
  const expectedRows: AttendanceRow[] = employees.map((e) => {
    const att = attMap.get(e.user_id);
    const checkIn = att?.check_in ?? null;
    const checkOut = att?.check_out ?? null;

    const inStatus: AttendanceRow["in_status"] = checkIn
      ? mytHour(checkIn) >= LATE_HOUR_MYT
        ? "late"
        : "on_time"
      : null;
    const outStatus: AttendanceRow["out_status"] = checkOut
      ? mytHour(checkOut) < EARLY_OUT_HOUR_MYT
        ? "early"
        : "normal"
      : null;

    const employment = e.employment[0];
    const homeBranchCode =
      employment?.branch?.branch_code ??
      (e.role_id === CEO_ROLE_ID ? CEO_HOME_BRANCH_CODE : null);

    return {
      user_id: e.user_id,
      name: e.user_profile?.full_name ?? `User #${e.user_id}`,
      employee_code: employment?.employee_id ?? null,
      department: employment?.department?.department_name ?? null,
      position: employment?.position ?? null,
      check_in: checkIn?.toISOString() ?? null,
      check_out: checkOut?.toISOString() ?? null,
      in_status: inStatus,
      out_status: outStatus,
      scans: logCountMap.get(e.user_id) ?? 0,
      home_branch_code: homeBranchCode,
      visiting_from: null,
    };
  });

  const visitorRows: AttendanceRow[] = visitors.map((v) => {
    const scans = branchScansByUser.get(v.user_id)!;
    const checkIn = scans.min;
    const checkOut = scans.count > 1 && scans.max > scans.min ? scans.max : null;

    const inStatus: AttendanceRow["in_status"] =
      mytHour(checkIn) >= LATE_HOUR_MYT ? "late" : "on_time";
    const outStatus: AttendanceRow["out_status"] = checkOut
      ? mytHour(checkOut) < EARLY_OUT_HOUR_MYT
        ? "early"
        : "normal"
      : null;

    const employment = v.employment[0];
    const isCeo = v.role_id === CEO_ROLE_ID;
    const homeBranchCode =
      employment?.branch?.branch_code ?? (isCeo ? CEO_HOME_BRANCH_CODE : null);
    const homeBranchName =
      employment?.branch?.branch_name ??
      (isCeo ? CEO_HOME_BRANCH_NAME : "another branch");

    return {
      user_id: v.user_id,
      name: v.user_profile?.full_name ?? `User #${v.user_id}`,
      employee_code: employment?.employee_id ?? null,
      department: employment?.department?.department_name ?? null,
      position: employment?.position ?? null,
      check_in: checkIn.toISOString(),
      check_out: checkOut?.toISOString() ?? null,
      in_status: inStatus,
      out_status: outStatus,
      scans: scans.count,
      home_branch_code: homeBranchCode,
      visiting_from: homeBranchName,
    };
  });

  const rows: AttendanceRow[] = [...expectedRows, ...visitorRows];

  // Counts only describe the assigned workforce — visitors don't change the
  // "missing" math, but they're counted separately in `scanned`.
  const expectedScanned = expectedRows.filter(
    (r) => r.check_in || r.check_out,
  ).length;
  const currentlyIn = rows.filter((r) => r.check_in && !r.check_out).length;
  const checkedOut = rows.filter((r) => r.check_in && r.check_out).length;
  const totalEmployees = expectedRows.length;
  const missing = totalEmployees - expectedScanned;
  const scanned = expectedScanned + visitorRows.length;

  const data: SummaryData = {
    branches: branchOptions,
    selectedBranch,
    counts: {
      scanned,
      currentlyIn,
      checkedOut,
      missing,
      totalEmployees,
    },
    scannerOnline,
    lastSyncedIso,
    recordsToday,
    rows,
  };

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <AttendanceSummaryView data={data} />
    </AppShell>
  );
}
