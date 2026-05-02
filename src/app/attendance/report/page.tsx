import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/app/components/AppShell";
import AttendanceReportView, {
  type EmployeeOption,
  type BranchOption,
  type DepartmentOption,
  type MonthOption,
  type DayRow,
  type EmployeeContext,
} from "@/app/components/AttendanceReportView";

export const dynamic = "force-dynamic";

// Roles that appear on the attendance report (raw role_id values from `role` table).
const REPORT_ROLE_IDS = [2, 4];
// Staff (role_id = 4) can open the page but only ever see their own attendance.
const STAFF_ROLE_ID = 4;

// Company convention: Sunday and Monday are off days
const WEEKEND_DAY_NUMBERS = new Set([0, 1]);
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TIME_FMT = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kuala_Lumpur",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

interface PageProps {
  searchParams: Promise<{
    employeeId?: string;
    month?: string;
    branch?: string;
    dept?: string;
    date?: string;
  }>;
}

export default async function AttendanceReportPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const sp = await searchParams;

  const me = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { user_id: true, role_id: true },
  });
  if (!me) redirect("/login");

  const restrictToSelf = me.role_id === STAFF_ROLE_ID;

  const [branches, departments, employees] = await Promise.all([
    prisma.branch.findMany({
      where: { branch_code: { not: null } },
      select: { branch_code: true, branch_name: true },
      orderBy: { branch_name: "asc" },
    }),
    prisma.department.findMany({
      select: { department_code: true, department_name: true },
      orderBy: { department_name: "asc" },
    }),
    prisma.users.findMany({
      where: {
        status: "active",
        deleted_at: null,
        role_id: { in: REPORT_ROLE_IDS },
      },
      select: {
        user_id: true,
        user_profile: { select: { full_name: true } },
        role: { select: { role_type: true } },
        employment: {
          take: 1,
          orderBy: { employment_id: "desc" },
          select: {
            position: true,
            branch: {
              select: {
                branch_code: true,
                branch_name: true,
                location: true,
              },
            },
            department: {
              select: { department_name: true, department_code: true },
            },
          },
        },
      },
      orderBy: { user_id: "asc" },
    }),
  ]);

  const employeesSorted = [...employees].sort((a, b) => {
    const an = a.user_profile?.full_name ?? "";
    const bn = b.user_profile?.full_name ?? "";
    return an.localeCompare(bn);
  });

  // Staff can never override the filter — only their own row is in scope.
  const branchFilter = restrictToSelf ? "" : (sp.branch ?? "");
  // Department filter only applies when branch is HQ (HQ employees are split by department).
  const deptFilter =
    !restrictToSelf && branchFilter === "HQ" ? (sp.dept ?? "") : "";
  const employeesForDropdown = restrictToSelf
    ? employeesSorted.filter((e) => e.user_id === me.user_id)
    : employeesSorted.filter((e) => {
        if (branchFilter && e.employment[0]?.branch?.branch_code !== branchFilter) return false;
        if (deptFilter && e.employment[0]?.department?.department_code !== deptFilter) return false;
        return true;
      });

  const employeeOptions: EmployeeOption[] = employeesForDropdown.map((e) => ({
    userId: e.user_id,
    name: e.user_profile?.full_name ?? `User #${e.user_id}`,
    branchCode: e.employment[0]?.branch?.branch_code ?? null,
  }));

  // Resolve selected employee — staff are pinned to themselves; others fall back
  // to first option, then current user.
  let selectedId: number;
  if (restrictToSelf) {
    selectedId = me.user_id;
  } else {
    const requested = sp.employeeId ? Number(sp.employeeId) : NaN;
    if (Number.isFinite(requested)) {
      selectedId = requested;
    } else {
      const fallback = employeesForDropdown.find((e) => e.user_id === me.user_id);
      selectedId = fallback ? me.user_id : employeesForDropdown[0]?.user_id ?? me.user_id;
    }
  }
  const selected = employeesSorted.find((e) => e.user_id === selectedId) ?? null;

  // Resolve month — default to current month in MYT
  const nowMyt = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" }),
  );
  const defaultMonth = `${nowMyt.getFullYear()}-${String(nowMyt.getMonth() + 1).padStart(2, "0")}`;

  // Optional single-day filter (?date=YYYY-MM-DD). When valid, narrows the
  // report to that one day and aligns `monthStr` to its month.
  let dateStr = "";
  if (sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date)) {
    const probe = new Date(sp.date + "T00:00:00Z");
    if (!isNaN(probe.getTime()) && probe.toISOString().slice(0, 10) === sp.date) {
      dateStr = sp.date;
    }
  }

  const monthStr = dateStr
    ? dateStr.slice(0, 7)
    : /^\d{4}-\d{2}$/.test(sp.month ?? "")
      ? sp.month!
      : defaultMonth;
  const [year, month] = monthStr.split("-").map(Number);

  // Iteration window for row generation: a single day if `dateStr` is set,
  // otherwise the whole month.
  const lastDayOfMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const startDay   = dateStr ? Number(dateStr.slice(8, 10)) : 1;
  const endDay     = dateStr ? Number(dateStr.slice(8, 10)) : lastDayOfMonth;
  const queryStart = new Date(Date.UTC(year, month - 1, startDay));
  const queryEnd   = new Date(Date.UTC(year, month - 1, endDay));

  const attendance = selected
    ? await prisma.attendance.findMany({
        where: {
          user_id: selected.user_id,
          date: { gte: queryStart, lte: queryEnd },
        },
        select: {
          date: true,
          check_in: true,
          check_out: true,
          status: true,
          total_hours: true,
        },
      })
    : [];

  const attMap = new Map(
    attendance.map((a) => [a.date.toISOString().slice(0, 10), a]),
  );

  const formatTime = (dt: Date | null | undefined): string | null =>
    dt ? TIME_FMT.format(dt) : null;

  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  let presentCount = 0;
  let noRecordCount = 0;
  let totalSeconds = 0;

  const rows: DayRow[] = [];
  for (let d = startDay; d <= endDay; d++) {
    const date = new Date(Date.UTC(year, month - 1, d));
    const isoDate = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const att = attMap.get(isoDate);
    const dayOfWeek = date.getUTCDay();
    const isWeekend = WEEKEND_DAY_NUMBERS.has(dayOfWeek);

    let status: DayRow["status"] = "no_record";
    if (isWeekend) status = "weekend";
    else if (att?.check_in) status = "present";

    let duration: string | null = null;
    if (att?.check_in && att?.check_out) {
      const diff = (att.check_out.getTime() - att.check_in.getTime()) / 1000;
      if (diff > 0) {
        duration = formatDuration(diff);
        totalSeconds += diff;
      }
    } else if (att?.total_hours) {
      const hrs = Number(att.total_hours);
      duration = formatDuration(hrs * 3600);
      totalSeconds += hrs * 3600;
    }

    if (status === "present") presentCount += 1;
    else if (status === "no_record") noRecordCount += 1;

    rows.push({
      day: d,
      dayName: DAY_LABELS[dayOfWeek],
      date: `${String(d).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`,
      isoDate,
      checkIn: formatTime(att?.check_in),
      checkOut: formatTime(att?.check_out),
      duration,
      status,
    });
  }

  const branchOptions: BranchOption[] = branches.map((b) => ({
    code: b.branch_code!,
    name: b.branch_name,
  }));

  // HQ-only department options derived from active staff actually assigned to HQ + a dept.
  const hqDeptCodes = new Set<string>();
  for (const u of employeesSorted) {
    const emp = u.employment[0];
    if (emp?.branch?.branch_code === "HQ" && emp?.department?.department_code) {
      hqDeptCodes.add(emp.department.department_code);
    }
  }
  const departmentOptions: DepartmentOption[] = departments
    .filter((d) => hqDeptCodes.has(d.department_code))
    .map((d) => ({ code: d.department_code, name: d.department_name }));

  const monthOptions: MonthOption[] = [];
  const baseYear = nowMyt.getFullYear();
  for (let yr = baseYear; yr >= baseYear - 1; yr--) {
    for (let mo = 12; mo >= 1; mo--) {
      const value = `${yr}-${String(mo).padStart(2, "0")}`;
      const label = new Date(yr, mo - 1, 1).toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      });
      monthOptions.push({ value, label });
    }
  }

  const monthLabel = new Date(year, month - 1, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const dateLabel = dateStr
    ? new Date(dateStr + "T00:00:00Z").toLocaleString("en-US", {
        weekday: "short",
        day:     "numeric",
        month:   "short",
        year:    "numeric",
        timeZone: "UTC",
      })
    : null;

  const employeeContext: EmployeeContext | null = selected
    ? {
        userId: selected.user_id,
        name: selected.user_profile?.full_name ?? null,
        position: selected.employment[0]?.position ?? null,
        department: selected.employment[0]?.department?.department_name ?? null,
        role: selected.role?.role_type ?? null,
        location:
          selected.employment[0]?.branch?.location ??
          selected.employment[0]?.branch?.branch_name ??
          null,
        branchCode: selected.employment[0]?.branch?.branch_code ?? null,
      }
    : null;

  const totalHoursLabel =
    totalSeconds > 0 ? formatDuration(totalSeconds) : null;

  const userEmail = session.user?.email ?? "";
  const userRole = (session.user as { role?: string } | undefined)?.role ?? "";
  const userName = session.user?.name ?? null;

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <AttendanceReportView
        branches={branchOptions}
        departments={departmentOptions}
        employees={employeeOptions}
        months={monthOptions}
        rows={rows}
        employee={employeeContext}
        selectedBranch={branchFilter}
        selectedDept={deptFilter}
        selectedEmployeeId={selected?.user_id ?? null}
        selectedMonth={monthStr}
        monthLabel={monthLabel}
        selectedDate={dateStr}
        dateLabel={dateLabel}
        restrictToSelf={restrictToSelf}
        summary={{
          present: presentCount,
          noRecord: noRecordCount,
          totalHours: totalHoursLabel,
        }}
      />
    </AppShell>
  );
}
