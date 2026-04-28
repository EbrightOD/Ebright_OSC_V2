"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Home,
  ChevronRight,
  MapPin,
  RotateCcw,
  Radio,
  RadioReceiver,
  Users,
  UserCheck,
  UserMinus,
  UserX,
  Info,
  Search,
  RefreshCw,
} from "lucide-react";

export type BranchOption = {
  branch_id: number;
  branch_name: string;
  branch_code: string | null;
};

export type AttendanceRow = {
  user_id: number;
  name: string;
  employee_code: string | null;
  department: string | null;
  position: string | null;
  check_in: string | null;
  check_out: string | null;
  in_status: "on_time" | "late" | null;
  out_status: "normal" | "early" | null;
  scans: number;
  // Home branch code (e.g. "HQ", "AMP") — shown as a chip in all-branches view.
  home_branch_code: string | null;
  // Set when the user is assigned to a different branch but scanned here today.
  visiting_from: string | null;
};

export type SummaryData = {
  branches: BranchOption[];
  selectedBranch: BranchOption | null;
  counts: {
    scanned: number;
    currentlyIn: number;
    checkedOut: number;
    missing: number;
    totalEmployees: number;
  };
  scannerOnline: boolean;
  lastSyncedIso: string | null;
  recordsToday: number;
  rows: AttendanceRow[];
};

const TIME_FMT = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kuala_Lumpur",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kuala_Lumpur",
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

type StatusFilter = "scanned" | "currentlyIn" | "checkedOut" | "missing";

const STATUS_PREDICATES: Record<StatusFilter, (r: AttendanceRow) => boolean> = {
  scanned: (r) => Boolean(r.check_in || r.check_out),
  currentlyIn: (r) => Boolean(r.check_in && !r.check_out),
  checkedOut: (r) => Boolean(r.check_in && r.check_out),
  // Visitors are never "missing" — only assigned employees can be missing.
  missing: (r) => !r.visiting_from && !r.check_in && !r.check_out,
};

export default function AttendanceSummaryView({ data }: { data: SummaryData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter | null>(null);
  const [now, setNow] = useState<Date | null>(null);

  // null selectedBranch === "All branches" mode
  const selectedBranchId = data.selectedBranch?.branch_id ?? null;
  const isAllBranches = data.selectedBranch === null;

  const onChangeBranch = (value: string) => {
    startTransition(() => {
      const path =
        value === "all"
          ? "/attendance/summary"
          : `/attendance/summary?branch=${value}`;
      router.replace(path);
    });
  };

  // Toggle: clicking the active card clears the filter
  const onSelectStatus = (status: StatusFilter) => {
    setStatusFilter((current) => (current === status ? null : status));
  };

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const predicate = statusFilter ? STATUS_PREDICATES[statusFilter] : null;
    return data.rows.filter((r) => {
      if (predicate && !predicate(r)) return false;
      if (!q) return true;
      return [r.name, r.employee_code, r.department, r.position]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q));
    });
  }, [data.rows, query, statusFilter]);

  const selectedBranch = data.selectedBranch;

  const scannedPct =
    data.counts.totalEmployees > 0
      ? Math.round((data.counts.scanned / data.counts.totalEmployees) * 100)
      : 0;

  const todayStr = DATE_FMT.format(now ?? new Date(0));
  const lastSyncedStr = data.lastSyncedIso
    ? TIME_FMT.format(new Date(data.lastSyncedIso))
    : "—";

  return (
    <div className="min-h-full bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 pt-4 pb-16 space-y-6">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-sm text-slate-500"
        >
          <Link
            href="/home"
            className="flex items-center gap-1 hover:text-slate-900 transition-all duration-200"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>Home</span>
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <Link
            href="/dashboards/hrms"
            className="hover:text-slate-900 transition-all duration-200"
          >
            HRMS
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <Link
            href="/attendance"
            className="hover:text-slate-900 transition-all duration-200"
          >
            Attendance
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <span className="text-slate-900 font-medium">Summary</span>
        </nav>

        {/* Header card with subtle gradient */}
        <header className="bg-gradient-to-b from-white to-slate-50 border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-600">
                  Live Dashboard
                </p>
                <span className="relative flex items-center">
                  <span className="absolute inline-flex w-2 h-2 rounded-full bg-indigo-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex w-2 h-2 rounded-full bg-indigo-600" />
                </span>
              </div>
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
                Today&rsquo;s Attendance
              </h1>
              <p className="mt-1.5 text-sm font-medium text-slate-500">
                {todayStr} · {selectedBranch?.branch_name ?? "All branches"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <BranchSelector
                branches={data.branches}
                selectedId={selectedBranchId}
                onChange={onChangeBranch}
                isPending={isPending}
              />
              {!isAllBranches && <ScannerStatusChip online={data.scannerOnline} />}
              <button
                type="button"
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-red-200 bg-white text-red-600 text-sm font-semibold hover:bg-red-50 hover:border-red-300 transition-all duration-200"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                End of Day Reset
              </button>
            </div>
          </div>
        </header>

        {/* Stat cards */}
        <section
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}
        >
          <StatCard
            label="Employees Scanned"
            value={data.counts.scanned}
            total={data.counts.totalEmployees}
            pct={scannedPct}
            Icon={Users}
            accent="indigo"
            caption={`of ${data.counts.totalEmployees} workforce`}
            selected={statusFilter === "scanned"}
            onSelect={() => onSelectStatus("scanned")}
          />
          <StatCard
            label="Currently In"
            value={data.counts.currentlyIn}
            Icon={UserCheck}
            accent="emerald"
            caption="still at the office"
            selected={statusFilter === "currentlyIn"}
            onSelect={() => onSelectStatus("currentlyIn")}
          />
          <StatCard
            label="Checked Out"
            value={data.counts.checkedOut}
            Icon={UserMinus}
            accent="amber"
            caption="left for the day"
            selected={statusFilter === "checkedOut"}
            onSelect={() => onSelectStatus("checkedOut")}
          />
          <StatCard
            label="Missing"
            value={data.counts.missing}
            Icon={UserX}
            accent="rose"
            caption="no scan yet"
            selected={statusFilter === "missing"}
            onSelect={() => onSelectStatus("missing")}
          />
        </section>

        {/* Table */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5 border-b border-slate-200">
            <div>
              <h2 className="text-base font-semibold text-slate-800">
                Today&rsquo;s Attendance
              </h2>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                {filteredRows.length} of {data.rows.length} employees shown
                {statusFilter && (
                  <>
                    {" · "}
                    <button
                      type="button"
                      onClick={() => setStatusFilter(null)}
                      className="text-indigo-600 font-semibold hover:text-indigo-800 underline-offset-2 hover:underline"
                    >
                      Clear filter
                    </button>
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search
                  className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search employee, dept…"
                  className="h-9 w-56 pl-9 pr-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all duration-200"
                />
              </div>
              <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600">
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                Auto-refresh · 5s
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 text-sm font-semibold text-slate-700">
                  <th className="text-left px-6 py-3 font-semibold">Employee</th>
                  <th className="text-left px-6 py-3 font-semibold">Department / Role</th>
                  <th className="text-left px-6 py-3 font-semibold">Check In</th>
                  <th className="text-left px-6 py-3 font-semibold">In Status</th>
                  <th className="text-left px-6 py-3 font-semibold">Check Out</th>
                  <th className="text-left px-6 py-3 font-semibold">Out Status</th>
                  <th className="text-right px-6 py-3 font-semibold">Scans</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-16 text-center text-sm font-medium text-slate-400"
                    >
                      {statusFilter
                        ? "No employees match this filter."
                        : "No attendance records yet today."}
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, idx) => (
                    <AttendanceTableRow
                      key={row.user_id}
                      row={row}
                      zebra={idx % 2 === 1}
                      showHomeBadge={isAllBranches}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Sync status strip — inside table footer */}
          <div className="flex items-center gap-2 px-6 py-3 border-t border-slate-200 bg-slate-50/50">
            <Info
              className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0"
              aria-hidden="true"
            />
            <span className="text-xs text-slate-600">
              Last synced{" "}
              <span className="font-semibold text-slate-700 tabular-nums">
                {lastSyncedStr}
              </span>{" "}
              ·{" "}
              <span className="font-semibold text-slate-700 tabular-nums">
                {data.recordsToday}
              </span>{" "}
              scan records today
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  total,
  pct,
  Icon,
  accent,
  caption,
  selected,
  onSelect,
}: {
  label: string;
  value: number;
  total?: number;
  pct?: number;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  accent: "indigo" | "emerald" | "amber" | "rose";
  caption: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const accents = {
    indigo: {
      leftBar: "border-l-indigo-500",
      iconTile: "bg-indigo-50",
      icon: "text-indigo-600",
      bar: "bg-indigo-500",
      ring: "ring-indigo-300 border-indigo-300",
      focus: "focus-visible:ring-indigo-400",
    },
    emerald: {
      leftBar: "border-l-emerald-500",
      iconTile: "bg-emerald-50",
      icon: "text-emerald-600",
      bar: "bg-emerald-500",
      ring: "ring-emerald-300 border-emerald-300",
      focus: "focus-visible:ring-emerald-400",
    },
    amber: {
      leftBar: "border-l-amber-500",
      iconTile: "bg-amber-50",
      icon: "text-amber-600",
      bar: "bg-amber-500",
      ring: "ring-amber-300 border-amber-300",
      focus: "focus-visible:ring-amber-400",
    },
    rose: {
      leftBar: "border-l-rose-500",
      iconTile: "bg-rose-50",
      icon: "text-rose-600",
      bar: "bg-rose-500",
      ring: "ring-rose-300 border-rose-300",
      focus: "focus-visible:ring-rose-400",
    },
  }[accent];

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`text-left bg-white border border-slate-200 border-l-4 ${accents.leftBar} rounded-2xl shadow-sm p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${accents.focus} ${selected ? `ring-2 shadow-md -translate-y-0.5 ${accents.ring}` : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <div
          className={`${accents.iconTile} w-9 h-9 rounded-xl flex items-center justify-center`}
        >
          <Icon className={`w-4 h-4 ${accents.icon}`} aria-hidden="true" />
        </div>
      </div>
      <p className="mt-4 text-4xl font-bold tracking-tight text-slate-800 tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-xs font-medium text-slate-500">{caption}</p>
      {typeof pct === "number" && total ? (
        <div className="mt-4 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full ${accents.bar} transition-all duration-500`}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
      ) : null}
    </button>
  );
}

function BranchSelector({
  branches,
  selectedId,
  onChange,
  isPending,
}: {
  branches: BranchOption[];
  selectedId: number | null;
  onChange: (value: string) => void;
  isPending: boolean;
}) {
  return (
    <label
      className={`inline-flex items-center h-10 rounded-xl border border-slate-200 bg-white px-3 gap-2 text-sm text-slate-700 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all duration-200 ${isPending ? "opacity-60" : ""}`}
    >
      <MapPin className="w-4 h-4 text-slate-500" aria-hidden="true" />
      <select
        value={selectedId === null ? "all" : String(selectedId)}
        onChange={(e) => onChange(e.target.value)}
        disabled={isPending}
        className="bg-transparent text-sm font-semibold text-slate-800 focus:outline-none pr-1 disabled:cursor-wait"
      >
        <option value="all">All branches</option>
        {branches.map((b) => (
          <option key={b.branch_id} value={b.branch_id}>
            {b.branch_name}
          </option>
        ))}
      </select>
    </label>
  );
}

function ScannerStatusChip({ online }: { online: boolean }) {
  if (online) {
    return (
      <span className="inline-flex items-center gap-2 h-10 pl-4 pr-4 rounded-full border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-700">
        <span className="relative inline-flex w-2 h-2 items-center justify-center">
          <span className="absolute inline-flex w-2 h-2 rounded-full bg-emerald-400 opacity-75 animate-ping" />
          <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" />
        </span>
        <Radio className="w-4 h-4" aria-hidden="true" />
        Scanner Connected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 h-10 pl-4 pr-4 rounded-full border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-500">
      <RadioReceiver className="w-4 h-4" aria-hidden="true" />
      Scanner Offline
    </span>
  );
}

function AttendanceTableRow({
  row,
  zebra,
  showHomeBadge,
}: {
  row: AttendanceRow;
  zebra: boolean;
  showHomeBadge: boolean;
}) {
  const rowBg = zebra ? "bg-slate-50/50" : "bg-white";
  return (
    <tr
      className={`${rowBg} hover:bg-slate-100 transition-colors duration-200 border-b border-slate-100 last:border-b-0`}
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full w-9 h-9 bg-indigo-100 text-indigo-700 font-semibold text-sm flex items-center justify-center shrink-0">
            {row.name
              .split(" ")
              .map((p) => p[0])
              .filter(Boolean)
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-sm font-semibold text-slate-800 truncate">
                {row.name}
              </div>
              {row.visiting_from ? (
                <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">
                  Visiting · {row.visiting_from}
                </span>
              ) : showHomeBadge && row.home_branch_code ? (
                <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">
                  {row.home_branch_code}
                </span>
              ) : null}
            </div>
            {row.employee_code && (
              <div className="text-[11px] font-medium text-slate-400 font-mono tracking-tight">
                {row.employee_code}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-1.5 text-sm">
          {row.department && (
            <span className="font-semibold text-slate-800">{row.department}</span>
          )}
          {row.department && row.position && (
            <span className="text-slate-300">/</span>
          )}
          {row.position && (
            <span className="font-medium text-slate-500">{row.position}</span>
          )}
          {!row.department && !row.position && (
            <span className="text-slate-400">—</span>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <TimeCell iso={row.check_in} tone={row.in_status === "late" ? "late" : "ok"} />
      </td>
      <td className="px-6 py-4">
        <StatusPill
          variant={
            row.in_status === "late"
              ? "late"
              : row.in_status === "on_time"
                ? "on_time"
                : "muted"
          }
          label={
            row.in_status === "late"
              ? "Late"
              : row.in_status === "on_time"
                ? "On Time"
                : "—"
          }
        />
      </td>
      <td className="px-6 py-4">
        <TimeCell iso={row.check_out} tone="ok" />
      </td>
      <td className="px-6 py-4">
        <StatusPill
          variant={
            row.out_status === "early"
              ? "early"
              : row.out_status === "normal"
                ? "normal"
                : "muted"
          }
          label={
            row.out_status === "early"
              ? "Early"
              : row.out_status === "normal"
                ? "Normal"
                : "—"
          }
        />
      </td>
      <td className="px-6 py-4 text-right">
        <span className="inline-flex items-center justify-center min-w-[32px] h-7 px-2 rounded-full bg-slate-100 text-xs font-semibold text-slate-700 tabular-nums">
          {row.scans}
        </span>
      </td>
    </tr>
  );
}

function TimeCell({
  iso,
  tone,
}: {
  iso: string | null;
  tone: "ok" | "late";
}) {
  if (!iso) {
    return <span className="text-slate-300 font-mono text-sm">—</span>;
  }
  return (
    <span
      className={`font-mono text-sm tabular-nums ${
        tone === "late" ? "text-amber-600 font-semibold" : "text-slate-700 font-medium"
      }`}
    >
      {TIME_FMT.format(new Date(iso))}
    </span>
  );
}

function StatusPill({
  variant,
  label,
}: {
  variant: "on_time" | "late" | "normal" | "early" | "muted";
  label: string;
}) {
  const styles = {
    on_time: "bg-emerald-100 text-emerald-700",
    late: "bg-amber-100 text-amber-700",
    normal: "bg-slate-100 text-slate-600",
    early: "bg-sky-100 text-sky-700",
    muted: "bg-slate-100 text-slate-400",
  }[variant];

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${styles}`}
    >
      {label}
    </span>
  );
}
