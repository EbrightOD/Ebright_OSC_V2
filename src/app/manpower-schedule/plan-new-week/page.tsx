"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Home,
  CalendarPlus,
  Building2,
  CalendarDays,
} from "lucide-react";
import AppShell from "@/app/components/AppShell";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Branch {
  branch_id: number;
  branch_name: string;
  branch_code: string | null;
  location: string | null;
  region: string | null;
  staff_count: number;
}

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const DAYS_SHORT = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ─── WeekPicker ───────────────────────────────────────────────────────────────

interface WeekPickerProps {
  selectedMonday: Date | null;
  onSelect: (monday: Date) => void;
}

function WeekPicker({ selectedMonday, onSelect }: WeekPickerProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [hoveredMonday, setHoveredMonday] = useState<Date | null>(null);

  const selectedSunday = selectedMonday
    ? new Date(selectedMonday.getTime() + 6 * 86_400_000)
    : null;
  const hoveredSunday = hoveredMonday
    ? new Date(hoveredMonday.getTime() + 6 * 86_400_000)
    : null;

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1);
  const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  type Cell = { date: Date; current: boolean };
  const cells: Cell[] = [];

  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({
      date: new Date(viewYear, viewMonth - 1, daysInPrevMonth - i),
      current: false,
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(viewYear, viewMonth, d), current: true });
  }
  while (cells.length % 7 !== 0) {
    cells.push({
      date: new Date(viewYear, viewMonth + 1, cells.length - daysInMonth - startOffset + 1),
      current: false,
    });
  }

  // Rows
  const rows: Cell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function handleDayClick(date: Date) {
    onSelect(getMondayOfWeek(date));
  }

  function getDigitClasses(cell: Cell, inSelectedWeek: boolean): string {
    const { date, current } = cell;
    const isToday = isSameDay(date, today);
    let cls = "relative z-10 w-9 h-9 inline-flex items-center justify-center text-sm rounded-full transition-colors pointer-events-none ";
    if (!current) {
      cls += "text-slate-300";
    } else if (inSelectedWeek) {
      cls += "text-white font-semibold";
    } else if (isToday) {
      cls += "text-blue-600 font-semibold underline";
    } else {
      cls += "text-slate-700";
    }
    return cls;
  }

  // For a given row, return [startCol, endCol] of the selected (or hovered)
  // week intersected with that row, or null if none. Used to position the
  // pill as a single element spanning grid columns.
  function rangeInRow(
    row: Cell[],
    rangeStart: Date | null,
    rangeEnd: Date | null,
  ): { startCol: number; endCol: number } | null {
    if (!rangeStart || !rangeEnd) return null;
    let startCol = -1;
    let endCol = -1;
    for (let i = 0; i < row.length; i++) {
      const d = row[i].date;
      if (d >= rangeStart && d <= rangeEnd) {
        if (startCol === -1) startCol = i;
        endCol = i;
      }
    }
    return startCol === -1 ? null : { startCol, endCol };
  }

  // Year options
  const curYear = today.getFullYear();
  const yearOptions = Array.from({ length: 7 }, (_, i) => curYear - 3 + i);

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Date range inputs */}
      <div className="flex gap-2 mb-5">
        <div
          className={`flex-1 text-center text-sm py-2.5 px-3 rounded-lg border transition-colors ${
            selectedMonday
              ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
              : "border-slate-200 text-slate-400 bg-white"
          }`}
        >
          {selectedMonday ? formatDate(selectedMonday) : "Start date"}
        </div>
        <div
          className={`flex-1 text-center text-sm py-2.5 px-3 rounded-lg border transition-colors ${
            selectedSunday
              ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
              : "border-slate-200 text-slate-400 bg-white"
          }`}
        >
          {selectedSunday ? formatDate(selectedSunday) : "End date"}
        </div>
      </div>

      {/* Month / Year navigation */}
      <div className="flex items-center justify-between mb-1">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex gap-2">
          <select
            value={viewMonth}
            onChange={e => setViewMonth(Number(e.target.value))}
            className="text-sm border border-slate-200 rounded-md px-2 py-1 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i}>{m}</option>
            ))}
          </select>
          <select
            value={viewYear}
            onChange={e => setViewYear(Number(e.target.value))}
            className="text-sm border border-slate-200 rounded-md px-2 py-1 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {yearOptions.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Month label */}
      <p className="text-xs text-slate-400 mb-3 pl-1">
        {MONTHS[viewMonth].slice(0, 3)} {viewYear}
      </p>

      {/* Calendar grid */}
      <div className="w-full">
        {/* Day-of-week header */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS_SHORT.map(d => (
            <div
              key={d}
              className="text-center text-xs font-medium text-slate-400"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Week rows */}
        <div onMouseLeave={() => setHoveredMonday(null)}>
          {rows.map((row, rIdx) => {
            const selRange = rangeInRow(row, selectedMonday, selectedSunday);
            const hovRange = rangeInRow(row, hoveredMonday, hoveredSunday);
            // Selected week takes precedence over hover.
            const showHover = !selRange && !!hovRange;

            return (
              <div
                key={rIdx}
                className="relative grid grid-cols-7 h-10"
              >
                {/* Selected pill — single element spanning the matching columns */}
                {selRange && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-9 bg-blue-600 rounded-full pointer-events-none z-0"
                    style={{
                      left:  `${(selRange.startCol / 7) * 100}%`,
                      right: `${((6 - selRange.endCol) / 7) * 100}%`,
                    }}
                  />
                )}

                {/* Hover outline pill */}
                {showHover && hovRange && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-9 border-2 border-blue-400 rounded-full pointer-events-none z-0"
                    style={{
                      left:  `${(hovRange.startCol / 7) * 100}%`,
                      right: `${((6 - hovRange.endCol) / 7) * 100}%`,
                    }}
                  />
                )}

                {/* Day cells — clickable, cursor-pointer over the whole cell */}
                {row.map((cell, cIdx) => {
                  const inSelectedWeek =
                    !!selRange &&
                    cIdx >= selRange.startCol &&
                    cIdx <= selRange.endCol;
                  return (
                    <div
                      key={cIdx}
                      className="relative flex items-center justify-center cursor-pointer"
                      onMouseEnter={() => setHoveredMonday(getMondayOfWeek(cell.date))}
                      onClick={() => handleDayClick(cell.date)}
                    >
                      <span className={getDigitClasses(cell, inSelectedWeek)}>
                        {cell.date.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Page Content ─────────────────────────────────────────────────────────────

interface PlanNewWeekContentProps {
  userRole: string;
}

function PlanNewWeekContent({ userRole }: PlanNewWeekContentProps) {
  const router = useRouter();
  const isAdmin = userRole === "ADMIN" || userRole === "SUPERADMIN";

  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [branchesError, setBranchesError] = useState<string | null>(null);

  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [selectedMonday, setSelectedMonday] = useState<Date | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const selectedSunday = selectedMonday
    ? new Date(selectedMonday.getTime() + 6 * 86_400_000)
    : null;

  // Derive distinct regions and the branch list filtered by region.
  // Branches without a region land in an "Other" bucket so they remain pickable.
  const OTHER_REGION = "Other";
  const regions = Array.from(
    new Set(branches.map(b => b.region?.trim() || OTHER_REGION))
  ).sort();
  const filteredBranches = selectedRegion
    ? branches.filter(b => (b.region?.trim() || OTHER_REGION) === selectedRegion)
    : [];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/branches");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Branch[] = await res.json();
        if (cancelled) return;
        setBranches(data);
        // Non-admin users get the first available branch auto-selected so
        // step 2 isn't gated for them.
        if (!isAdmin && data.length > 0) {
          const first = data[0];
          setSelectedRegion(first.region?.trim() || OTHER_REGION);
          setSelectedBranch(first);
        }
      } catch (err) {
        if (cancelled) return;
        setBranchesError(err instanceof Error ? err.message : "Failed to load branches");
      } finally {
        if (!cancelled) setBranchesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  function handleRegionChange(value: string) {
    setSelectedRegion(value);
    setSelectedBranch(null);
    setSelectedMonday(null);
    setConfirmed(false);
  }

  function handleBranchChange(value: string) {
    const id = Number(value);
    const branch = branches.find(b => b.branch_id === id) ?? null;
    setSelectedBranch(branch);
    setSelectedMonday(null);
    setConfirmed(false);
  }

  function handleWeekSelect(monday: Date) {
    setSelectedMonday(monday);
    setConfirmed(false);
  }

  function handleConfirm() {
    if (!selectedBranch || !selectedMonday || !selectedSunday) return;
    setConfirmed(true);
    const startISO = selectedMonday.toISOString().slice(0, 10);
    const endISO   = selectedSunday.toISOString().slice(0, 10);
    const params = new URLSearchParams({
      branch: selectedBranch.branch_name,
      branch_id: String(selectedBranch.branch_id),
      start: startISO,
      end: endISO,
    });
    router.push(`/manpower-schedule/plan-new-week/grid?${params.toString()}`);
  }

  return (
    <div className="min-h-full bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 pt-4 pb-12">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-sm text-slate-500 mb-6"
        >
          <Link
            href="/home"
            className="flex items-center gap-1 hover:text-slate-900 transition-colors"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>Home</span>
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <Link
            href="/dashboards/hrms"
            className="hover:text-slate-900 transition-colors"
          >
            HRMS
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <Link
            href="/manpower-schedule"
            className="hover:text-slate-900 transition-colors"
          >
            Manpower Planning
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <span className="text-slate-900 font-medium">Plan New Week</span>
        </nav>

        {/* Page heading — left-aligned like other pages */}
        <header className="mb-8 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
            <CalendarPlus className="w-6 h-6 text-emerald-600" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-600 mb-1">
              Manpower
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
              Plan New Week
            </h1>
            <p className="mt-1.5 text-sm text-slate-600 max-w-xl">
              Pick a branch and the upcoming week to build the new manpower roster.
            </p>
          </div>
        </header>

        {/* Centered card */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

        {/* ── Step 1: Branch ── */}
        <div className="p-6 md:p-8">
          <div className="flex items-start gap-4 mb-5">
            <span className="w-9 h-9 rounded-full bg-blue-600 text-white text-sm font-semibold inline-flex items-center justify-center shrink-0 ring-4 ring-blue-100">
              1
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-500" aria-hidden="true" />
                <p className="text-sm font-semibold text-slate-900">Select branch</p>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Choose the branch you want to plan manpower for
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Region */}
            <select
              value={selectedRegion}
              onChange={e => handleRegionChange(e.target.value)}
              disabled={branchesLoading || !!branchesError}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none disabled:bg-slate-50 disabled:cursor-not-allowed"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%236b7280' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
                paddingRight: "36px",
              }}
            >
              <option value="">
                {branchesLoading
                  ? "Loading..."
                  : branchesError
                  ? "Failed to load"
                  : "Region"}
              </option>
              {regions.map(r => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            {/* Branch */}
            <select
              value={selectedBranch?.branch_id ?? ""}
              onChange={e => handleBranchChange(e.target.value)}
              disabled={
                branchesLoading || !!branchesError || !selectedRegion
              }
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none disabled:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%236b7280' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
                paddingRight: "36px",
              }}
            >
              <option value="">
                {selectedRegion ? "Branch" : "Pick region first"}
              </option>
              {filteredBranches.map(b => (
                <option key={b.branch_id} value={b.branch_id}>
                  {b.branch_name}
                  {b.location ? ` — ${b.location}` : ""}
                </option>
              ))}
            </select>
          </div>

          {branchesError && (
            <p className="mt-2 text-xs text-rose-600">{branchesError}</p>
          )}

          {selectedBranch && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
              <span className="text-xs text-blue-700">
                {selectedBranch.region
                  ? `Region ${selectedBranch.region} - `
                  : ""}
                {selectedBranch.branch_name} ({selectedBranch.staff_count}{" "}
                {selectedBranch.staff_count === 1 ? "staff" : "staffs"})
              </span>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100" />

        {/* ── Step 2: Week ── */}
        <div
          className={`p-6 md:p-8 bg-slate-50/50 transition-opacity duration-200 ${
            selectedBranch ? "opacity-100" : "opacity-40 pointer-events-none"
          }`}
        >
          <div className="flex items-start gap-4 mb-6">
            <span
              className={`w-9 h-9 rounded-full text-white text-sm font-semibold inline-flex items-center justify-center shrink-0 ring-4 transition-colors ${
                selectedBranch
                  ? "bg-blue-600 ring-blue-100"
                  : "bg-slate-300 ring-slate-100"
              }`}
            >
              2
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-slate-500" aria-hidden="true" />
                <p className="text-sm font-semibold text-slate-900">Select a week</p>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Click any day — the full Mon – Sun week will be highlighted
              </p>
            </div>
          </div>

          <WeekPicker
            selectedMonday={selectedMonday}
            onSelect={handleWeekSelect}
          />

          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            disabled={!selectedMonday}
            className={`mt-6 block w-full py-4 rounded-full text-sm font-semibold uppercase tracking-wider transition-colors ${
              selectedMonday
                ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer shadow-sm"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            {selectedMonday && selectedSunday
              ? `Confirm week: ${formatDate(selectedMonday)} – ${formatDate(selectedSunday)}`
              : "Select a week to continue"}
          </button>
        </div>
      </div>

          {/* Confirmed banner */}
          {confirmed && selectedBranch && selectedMonday && selectedSunday && (
            <div className="mt-5 flex items-center gap-3 px-4 py-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-emerald-800">
                  Planning new week for{" "}
                  <span className="font-semibold">{selectedBranch.branch_name}</span>
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  {formatDate(selectedMonday)} – {formatDate(selectedSunday)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page (with AppShell) ─────────────────────────────────────────────────────

export default function PlanNewWeekPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login");
    },
  });

  if (status === "loading") {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full text-blue-600 font-semibold text-lg">
          Loading...
        </div>
      </AppShell>
    );
  }

  const userEmail = session?.user?.email || "";
  const userRole  = (session?.user as { role?: string } | undefined)?.role || "USER";
  const userName  = session?.user?.name ?? null;

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <PlanNewWeekContent userRole={userRole} />
    </AppShell>
  );
}
