"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  Home,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
} from "lucide-react";

export interface BranchOption {
  code: string;
  name: string;
}

export interface DepartmentOption {
  code: string;
  name: string;
}

export interface EmployeeOption {
  userId: number;
  name: string;
  branchCode: string | null;
}

export interface MonthOption {
  value: string;
  label: string;
}

export interface DayRow {
  day: number;
  dayName: string;
  date: string;
  isoDate: string;
  checkIn: string | null;
  checkOut: string | null;
  duration: string | null;
  status: "present" | "no_record" | "weekend" | "leave";
}

export interface EmployeeContext {
  userId: number;
  name: string | null;
  position: string | null;
  department: string | null;
  role: string | null;
  location: string | null;
  branchCode: string | null;
}

interface Summary {
  present: number;
  noRecord: number;
  totalHours: string | null;
}

interface Props {
  branches: BranchOption[];
  departments: DepartmentOption[];
  employees: EmployeeOption[];
  months: MonthOption[];
  rows: DayRow[];
  employee: EmployeeContext | null;
  selectedBranch: string;
  selectedDept: string;
  selectedEmployeeId: number | null;
  selectedMonth: string;
  monthLabel: string;
  restrictToSelf?: boolean;
  summary: Summary;
}

const STATUS_BADGE: Record<
  DayRow["status"],
  { bg: string; text: string; dot: string; label: string; rowTint: string }
> = {
  present:   { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Present",    rowTint: "" },
  no_record: { bg: "bg-rose-50",    text: "text-rose-600",    dot: "bg-rose-500",    label: "No Record",  rowTint: "" },
  weekend:   { bg: "bg-stone-200/70", text: "text-stone-500",  dot: "bg-stone-400",  label: "Weekend",    rowTint: "bg-stone-100/70" },
  leave:     { bg: "bg-violet-50",  text: "text-violet-700",  dot: "bg-violet-500",  label: "On Leave",   rowTint: "" },
};

// Hex values used directly via inline `style` so Tailwind JIT can't strip them.
const AVATAR_COLORS = [
  "#059669", // emerald-600
  "#2563eb", // blue-600
  "#7c3aed", // violet-600
  "#d97706", // amber-600
  "#e11d48", // rose-600
  "#0d9488", // teal-600
  "#4f46e5", // indigo-600
  "#ea580c", // orange-600
];
const AVATAR_FALLBACK = "#64748b"; // slate-500

function getInitials(name: string | null): string {
  if (!name) return "?";
  const cleaned = name.replace(/[^a-zA-Z0-9\s]/g, "");
  const parts = cleaned.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function colorForName(name: string | null): string {
  if (!name) return AVATAR_FALLBACK;
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[hash];
}

export default function AttendanceReportView({
  branches,
  departments,
  employees,
  months,
  rows,
  employee,
  selectedBranch,
  selectedDept,
  selectedEmployeeId,
  selectedMonth,
  monthLabel,
  restrictToSelf = false,
  summary,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const updateParams = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams();
    if (selectedBranch) params.set("branch", selectedBranch);
    if (selectedDept) params.set("dept", selectedDept);
    if (selectedEmployeeId != null) params.set("employeeId", String(selectedEmployeeId));
    if (selectedMonth) params.set("month", selectedMonth);
    for (const [k, v] of Object.entries(changes)) {
      if (v === null || v === "") params.delete(k);
      else params.set(k, v);
    }
    startTransition(() => {
      router.replace(`/attendance/report?${params.toString()}`);
    });
  };

  const branchLabel =
    branches.find((b) => b.code === selectedBranch)?.name ?? "All branches";
  const deptLabel =
    departments.find((d) => d.code === selectedDept)?.name ?? "All departments";
  const employeeLabel =
    employees.find((e) => e.userId === selectedEmployeeId)?.name ??
    (employee ? employee.name ?? `User #${employee.userId}` : "—");
  const displayName = employee
    ? employee.name ?? `User #${employee.userId}`
    : "—";
  // Subtitle prefers position (e.g. "FT COACH"); falls back to department name.
  const subtitle = employee?.position ?? employee?.department ?? null;

  // months are sorted newest-first; previous = next index, next = prev index
  const monthIdx = months.findIndex((m) => m.value === selectedMonth);
  const prevMonth = monthIdx >= 0 ? months[monthIdx + 1]?.value : undefined;
  const nextMonth = monthIdx > 0 ? months[monthIdx - 1]?.value : undefined;

  const workingDays = summary.present + summary.noRecord;
  const attendanceRate = workingDays > 0 ? Math.round((summary.present / workingDays) * 100) : 0;

  return (
    <div className="min-h-full bg-stone-100/60">
      <div className="max-w-6xl mx-auto px-6 pt-4 pb-16">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/home" className="flex items-center gap-1 hover:text-slate-900 transition-colors">
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>Home</span>
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <Link href="/dashboards/hrms" className="hover:text-slate-900 transition-colors">HRMS</Link>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <Link href="/attendance" className="hover:text-slate-900 transition-colors">Attendance</Link>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <span className="text-slate-900 font-medium">Report</span>
        </nav>

        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Attendance Report
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Daily clock-in breakdown from the thumbprint scanner.
          </p>
        </header>

        {/* Filter pills */}
        <div
          className={`flex flex-wrap items-stretch gap-3 mb-5 transition-opacity ${isPending ? "opacity-60" : ""}`}
          aria-label="Filters"
        >
          {!restrictToSelf && (
            <>
              <FilterPill label="Branch" value={branchLabel}>
                <select
                  value={selectedBranch}
                  onChange={(e) =>
                    updateParams({ branch: e.target.value || null, dept: null, employeeId: null })
                  }
                >
                  <option value="">All branches</option>
                  {branches.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </FilterPill>

              {selectedBranch === "HQ" && departments.length > 0 && (
                <FilterPill label="Department" value={deptLabel}>
                  <select
                    value={selectedDept}
                    onChange={(e) =>
                      updateParams({ dept: e.target.value || null, employeeId: null })
                    }
                  >
                    <option value="">All departments</option>
                    {departments.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </FilterPill>
              )}

              <FilterPill label="Employee" value={employeeLabel}>
                <select
                  value={selectedEmployeeId ?? ""}
                  onChange={(e) => updateParams({ employeeId: e.target.value || null })}
                  disabled={employees.length === 0}
                >
                  {employees.length === 0 && <option value="">No employees</option>}
                  {employees.map((e) => (
                    <option key={e.userId} value={e.userId}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </FilterPill>
            </>
          )}

          <MonthPill
            label="Month"
            value={monthLabel}
            onPrev={prevMonth ? () => updateParams({ month: prevMonth }) : null}
            onNext={nextMonth ? () => updateParams({ month: nextMonth }) : null}
          >
            <select
              value={selectedMonth}
              onChange={(e) => updateParams({ month: e.target.value || null })}
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </MonthPill>
        </div>

        {/* Hero card */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-4 min-w-0">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0"
                style={{ backgroundColor: colorForName(displayName) }}
              >
                {getInitials(displayName)}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-slate-900 truncate">{displayName}</h2>
                {subtitle && (
                  <p className="text-sm text-slate-500 truncate">{subtitle}</p>
                )}
              </div>
            </div>

            <div className="flex items-stretch gap-2.5">
              <StatTile bg="bg-emerald-50" labelColor="text-emerald-700" value={summary.present} label="Present" />
              <StatTile bg="bg-rose-50"    labelColor="text-rose-600"    value={summary.noRecord} label="No Record" />
              <StatTile bg="bg-stone-200/60" labelColor="text-slate-600" value={summary.totalHours ?? "—"} label="Total Hours" mono={!!summary.totalHours} />
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${attendanceRate}%` }}
              />
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
              <span>{attendanceRate}% attendance rate this month</span>
              <span>
                {summary.present} / {workingDays} working days
              </span>
            </div>
          </div>
        </section>

        {/* Daily table */}
        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                  <th className="py-3 px-4 w-[6%]">#</th>
                  <th className="py-3 px-3 w-[10%]">Day</th>
                  <th className="py-3 px-3 w-[14%]">Date</th>
                  <th className="py-3 px-3 w-[15%]">Clock In</th>
                  <th className="py-3 px-3 w-[15%]">Clock Out</th>
                  <th className="py-3 px-3 w-[15%]">Duration</th>
                  <th className="py-3 px-4 text-right w-[25%]">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-sm text-slate-400">
                      No data for this selection.
                    </td>
                  </tr>
                )}
                {rows.map((r) => {
                  const badge = STATUS_BADGE[r.status];
                  const dim = r.status === "weekend" || r.status === "no_record";
                  return (
                    <tr
                      key={r.isoDate}
                      className={`border-b border-slate-100 last:border-b-0 transition-colors hover:bg-slate-50/60 ${badge.rowTint}`}
                    >
                      <td className={`py-3 px-4 tabular-nums ${dim ? "text-slate-400" : "text-slate-500"}`}>
                        {r.day}
                      </td>
                      <td className={`py-3 px-3 ${dim ? "text-slate-500" : "text-slate-900 font-semibold"}`}>
                        {r.dayName}
                      </td>
                      <td className={`py-3 px-3 font-mono tabular-nums ${dim ? "text-slate-400" : "text-slate-500"}`}>
                        {r.date}
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums">
                        {r.checkIn ? (
                          <span className="text-slate-900">{r.checkIn}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums">
                        {r.checkOut ? (
                          <span className="text-slate-900">{r.checkOut}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums">
                        {r.duration ? (
                          <span className="text-slate-700">{r.duration}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <p className="mt-5 text-xs text-slate-500 leading-relaxed">
          Sun &amp; Mon are off days · Hours calculated from clock-in to clock-out
          <br />
          Data pulled live from the thumbprint scanner
        </p>
      </div>
    </div>
  );
}

function FilterPill({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: React.ReactElement<React.SelectHTMLAttributes<HTMLSelectElement>>;
}) {
  return (
    <label className="group relative inline-flex items-stretch rounded-lg border border-slate-200 bg-white overflow-hidden hover:border-slate-300 focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-100 transition cursor-pointer">
      <span className="px-3 self-center text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/80 border-r border-slate-200 py-2.5">
        {label}
      </span>
      <span className="px-3 py-2 inline-flex items-center gap-2">
        <span className="text-sm font-medium text-slate-900 max-w-[200px] truncate">{value}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
      </span>
      <SelectOverlay>{children}</SelectOverlay>
    </label>
  );
}

function MonthPill({
  label,
  value,
  onPrev,
  onNext,
  children,
}: {
  label: string;
  value: string;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
  children: React.ReactElement<React.SelectHTMLAttributes<HTMLSelectElement>>;
}) {
  return (
    <div className="inline-flex items-stretch rounded-lg border border-slate-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={onPrev ?? undefined}
        disabled={!onPrev}
        className="px-2 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed border-r border-slate-200 transition-colors"
        aria-label="Previous month"
      >
        <ChevronLeft className="w-4 h-4 text-slate-500" aria-hidden="true" />
      </button>
      <label className="group relative inline-flex items-stretch hover:bg-slate-50/60 focus-within:bg-slate-50/60 transition cursor-pointer">
        <span className="px-3 self-center text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/80 border-r border-slate-200 py-2.5">
          {label}
        </span>
        <span className="px-3 py-2 inline-flex items-center gap-2">
          <span className="text-sm font-medium text-slate-900">{value}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
        </span>
        <SelectOverlay>{children}</SelectOverlay>
      </label>
      <button
        type="button"
        onClick={onNext ?? undefined}
        disabled={!onNext}
        className="px-2 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed border-l border-slate-200 transition-colors"
        aria-label="Next month"
      >
        <ChevronRight className="w-4 h-4 text-slate-500" aria-hidden="true" />
      </button>
    </div>
  );
}

function SelectOverlay({
  children,
}: {
  children: React.ReactElement<React.SelectHTMLAttributes<HTMLSelectElement>>;
}) {
  const select = children;
  const merged = `${select.props.className ?? ""} absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed`;
  return <select {...select.props} className={merged} />;
}

function StatTile({
  bg,
  labelColor,
  value,
  label,
  mono = false,
}: {
  bg: string;
  labelColor: string;
  value: string | number;
  label: string;
  mono?: boolean;
}) {
  return (
    <div className={`${bg} rounded-xl px-4 py-2.5 min-w-[88px] text-center`}>
      <p className={`text-xl font-bold text-slate-900 leading-tight ${mono ? "font-mono tabular-nums" : ""}`}>
        {value}
      </p>
      <p className={`text-[11px] font-medium mt-0.5 ${labelColor}`}>{label}</p>
    </div>
  );
}
