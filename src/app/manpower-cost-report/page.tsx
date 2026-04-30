"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Home as HomeIcon, ChevronRight, Search, Calendar, Download, ChevronDown } from "lucide-react";
import AppShell from "@/app/components/AppShell";

// ─── Reference data (no backend) ──────────────────────────────────────────────

const REGIONS = [
  {
    value: "region-a",
    label: "Region A",
    branches: ["Rimbayu", "Klang", "Shah Alam", "Setia Alam", "Denai Alam", "Eco Grandeur", "Subang Taipan"],
  },
  {
    value: "region-b",
    label: "Region B",
    branches: ["Danau Kota", "Kota Damansara", "Ampang", "Sri Petaling", "Bandar Tun Hussein Onn", "Kajang TTDI Groove", "Taman Sri Gombak"],
  },
  {
    value: "region-c",
    label: "Region C",
    branches: ["Putrajaya", "Kota Warisan", "Bandar Baru Bangi", "Cyberjaya", "Bandar Seri Putra", "Dataran Puchong Utama", "Online"],
  },
];

const AVAILABLE_MONTHS = [
  { value: "2026-04", label: "April 2026" },
  { value: "2026-03", label: "March 2026" },
  { value: "2026-02", label: "February 2026" },
  { value: "2026-01", label: "January 2026" },
  { value: "2025-12", label: "December 2025" },
  { value: "2025-11", label: "November 2025" },
];

const AVAILABLE_WEEKS = [
  { value: "", label: "Full Month" },
  { value: "2026-04-06:::2026-04-12", label: "Wk1 (6-12 Apr)" },
  { value: "2026-04-13:::2026-04-19", label: "Wk2 (13-19 Apr)" },
  { value: "2026-04-20:::2026-04-26", label: "Wk3 (20-26 Apr)" },
];

interface StaffRow {
  id: string;
  name: string;
  employeeId: string;
  branch: string;
  isPT: boolean;
  coachHrs: number;
  execHrs: number;
  totalHrs: number;
  rate: number | null;
  totalPay: number;
}

const DEMO_STAFF: StaffRow[] = [
  { id: "s1",  name: "Aishah Nurfitri",  employeeId: "EB-1024", branch: "Ampang",            isPT: true,  coachHrs: 18.5, execHrs: 22.0, totalHrs: 40.5, rate: 12, totalPay: 458.00 },
  { id: "s2",  name: "Aidil Hakim",       employeeId: "EB-1025", branch: "Ampang",            isPT: true,  coachHrs: 15.0, execHrs: 25.5, totalHrs: 40.5, rate: 11, totalPay: 445.50 },
  { id: "s3",  name: "Farhan Zaki",       employeeId: "EB-1026", branch: "Bandar Seri Putra", isPT: false, coachHrs: 22.0, execHrs: 18.0, totalHrs: 40.0, rate: null, totalPay: 0 },
  { id: "s4",  name: "Nur Aina Syazwana", employeeId: "EB-1027", branch: "Bandar Seri Putra", isPT: true,  coachHrs: 20.0, execHrs: 20.5, totalHrs: 40.5, rate: 13, totalPay: 485.50 },
  { id: "s5",  name: "Hakim Hassan",      employeeId: "EB-1028", branch: "Klang",             isPT: true,  coachHrs: 14.0, execHrs: 26.0, totalHrs: 40.0, rate: 10, totalPay: 426.00 },
  { id: "s6",  name: "Sarah Izzati",      employeeId: "EB-1029", branch: "Klang",             isPT: false, coachHrs: 24.5, execHrs: 16.0, totalHrs: 40.5, rate: null, totalPay: 0 },
  { id: "s7",  name: "Danish Harith",     employeeId: "EB-1030", branch: "Setia Alam",        isPT: true,  coachHrs: 16.0, execHrs: 24.0, totalHrs: 40.0, rate: 11, totalPay: 440.00 },
  { id: "s8",  name: "Amira Sofea",       employeeId: "EB-1031", branch: "Setia Alam",        isPT: true,  coachHrs: 19.5, execHrs: 21.0, totalHrs: 40.5, rate: 12, totalPay: 465.00 },
  { id: "s9",  name: "Iman Hakim",        employeeId: "EB-1032", branch: "Putrajaya",         isPT: false, coachHrs: 26.0, execHrs: 14.0, totalHrs: 40.0, rate: null, totalPay: 0 },
  { id: "s10", name: "Zara Nadia",        employeeId: "EB-1033", branch: "Cyberjaya",         isPT: true,  coachHrs: 17.5, execHrs: 23.0, totalHrs: 40.5, rate: 11, totalPay: 445.50 },
];

const EXEC_RATE = 11;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtHrs(h: number): string {
  const hrs = Math.floor(h);
  const min = Math.round((h - hrs) * 60);
  return `${hrs}h ${min.toString().padStart(2, "0")}m`;
}

// ─── Page Content ─────────────────────────────────────────────────────────────

type ViewTab = "all" | "pt" | "ft";

function ManpowerCostReportContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewTab, setViewTab] = useState<ViewTab>("all");
  const [selectedMonth, setSelectedMonth] = useState(AVAILABLE_MONTHS[0].value);
  const [weekFilter, setWeekFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const branchOptions = useMemo(() => {
    if (!regionFilter) return [];
    return REGIONS.find(r => r.value === regionFilter)?.branches ?? [];
  }, [regionFilter]);

  const filteredStaff = useMemo(() => {
    return DEMO_STAFF.filter(s => {
      if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (viewTab === "pt" && !s.isPT) return false;
      if (viewTab === "ft" && s.isPT) return false;
      if (regionFilter) {
        const region = REGIONS.find(r => r.value === regionFilter);
        if (region && !region.branches.includes(s.branch)) return false;
      }
      if (branchFilter && s.branch !== branchFilter) return false;
      return true;
    });
  }, [searchQuery, viewTab, regionFilter, branchFilter]);

  const totals = useMemo(() => {
    const totalStaff = filteredStaff.length;
    const ptCount = filteredStaff.filter(s => s.isPT).length;
    const ftCount = totalStaff - ptCount;
    const totalCoachHrs = filteredStaff.reduce((a, s) => a + s.coachHrs, 0);
    const totalExecHrs  = filteredStaff.reduce((a, s) => a + s.execHrs, 0);
    const totalHrs      = totalCoachHrs + totalExecHrs;
    const totalPay      = filteredStaff.reduce((a, s) => a + s.totalPay, 0);
    return { totalStaff, ptCount, ftCount, totalCoachHrs, totalExecHrs, totalHrs, totalPay };
  }, [filteredStaff]);

  const monthLabel = AVAILABLE_MONTHS.find(m => m.value === selectedMonth)?.label ?? selectedMonth;
  const hasActiveFilters = !!(searchQuery || viewTab !== "all" || weekFilter || regionFilter || branchFilter);

  function clearFilters() {
    setSearchQuery("");
    setViewTab("all");
    setWeekFilter("");
    setRegionFilter("");
    setBranchFilter("");
  }

  function handleRegionChange(v: string) {
    setRegionFilter(v);
    setBranchFilter("");
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
            <HomeIcon className="w-4 h-4" aria-hidden="true" />
            <span>Home</span>
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <Link href="/dashboards/hrms" className="hover:text-slate-900 transition-colors">
            HRMS
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <span className="text-slate-900 font-medium">Manpower Cost Report</span>
        </nav>

        {/* Page heading */}
        <header className="mb-8 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center shrink-0">
            <span className="text-2xl">💰</span>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-teal-600 mb-1">
              Manpower
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
              Manpower Cost Report
            </h1>
            <p className="mt-1.5 text-sm text-slate-600 max-w-xl">
              Breakdown of labor costs across branches, with per-staff hours and pay.
            </p>
          </div>
        </header>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search name..."
              className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all w-[180px]"
            />
          </div>

          <ToolbarSelect
            value={viewTab}
            onChange={v => setViewTab(v as ViewTab)}
            options={[
              { value: "all", label: "All Staff" },
              { value: "pt",  label: "Part-Time" },
              { value: "ft",  label: "Full-Time" },
            ]}
          />

          <ToolbarSelect
            value={selectedMonth}
            onChange={setSelectedMonth}
            options={AVAILABLE_MONTHS}
            icon={<Calendar className="w-4 h-4" />}
          />

          <ToolbarSelect
            value={weekFilter}
            onChange={setWeekFilter}
            options={AVAILABLE_WEEKS}
            placeholder="Week"
            icon={<Calendar className="w-4 h-4" />}
          />

          <ToolbarSelect
            value={regionFilter}
            onChange={handleRegionChange}
            options={[
              { value: "", label: "All Regions" },
              ...REGIONS.map(r => ({ value: r.value, label: r.label })),
            ]}
          />

          {regionFilter && branchOptions.length > 0 && (
            <ToolbarSelect
              value={branchFilter}
              onChange={setBranchFilter}
              options={[
                { value: "", label: "All Branches" },
                ...branchOptions.map(b => ({ value: b, label: b })),
              ]}
            />
          )}

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-all"
            >
              Clear
            </button>
          )}
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className="rounded-2xl p-4 bg-white border border-slate-200">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Staff</p>
            <p className="text-2xl font-black text-slate-700">{totals.totalStaff}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">PT: {totals.ptCount} | FT: {totals.ftCount}</p>
          </div>
          <div className="rounded-2xl p-4 bg-white border border-slate-200">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Hours</p>
            <p className="text-xl font-black text-blue-600">{fmtHrs(totals.totalHrs)}</p>
          </div>
          <div className="rounded-2xl p-4 bg-orange-50 border border-orange-200">
            <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1">Coach Hours</p>
            <p className="text-xl font-black text-orange-600">{fmtHrs(totals.totalCoachHrs)}</p>
          </div>
          <div className="rounded-2xl p-4 bg-indigo-50 border border-indigo-200">
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Exec Hours</p>
            <p className="text-xl font-black text-indigo-600">{fmtHrs(totals.totalExecHrs)}</p>
          </div>
          <div className="rounded-2xl p-4 bg-green-50 border border-green-200">
            <p className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-1">PT Cost</p>
            <p className="text-xl font-black text-green-600">
              RM {totals.totalPay.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-2xl p-4 bg-white border border-slate-200">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Avg / PT</p>
            <p className="text-xl font-black text-slate-600">
              RM {totals.ptCount > 0 ? (totals.totalPay / totals.ptCount).toFixed(0) : "0"}
            </p>
          </div>
        </div>

        {/* Rate info bar + PDF */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 mb-6 flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs text-slate-500">
            <span className="font-bold text-slate-700">Exec Rate:</span> RM {EXEC_RATE}/hr (fixed)
            <span className="mx-3 text-slate-300">|</span>
            <span className="font-bold text-slate-700">Coach Rate:</span> per employee profile (PT only)
            <span className="mx-3 text-slate-300">|</span>
            <span className="font-bold text-slate-700">Period:</span> {monthLabel}
            <span className="mx-3 text-slate-300">|</span>
            <span className="font-bold text-slate-700">FT:</span> hours only (fixed salary)
          </p>
          <button className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-all flex items-center gap-1.5 shrink-0">
            <Download className="w-3.5 h-3.5" />
            PDF
          </button>
        </div>

        {/* Staff table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Branch</th>
                  <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Type</th>
                  <th className="px-5 py-4 text-xs font-bold text-orange-500 uppercase tracking-wider text-center">Coach Hrs</th>
                  <th className="px-5 py-4 text-xs font-bold text-indigo-500 uppercase tracking-wider text-center">Exec Hrs</th>
                  <th className="px-5 py-4 text-xs font-bold text-blue-500 uppercase tracking-wider text-center">Total Hrs</th>
                  {viewTab !== "ft" && (
                    <>
                      <th className="px-5 py-4 text-xs font-bold text-orange-500 uppercase tracking-wider text-center">Rate</th>
                      <th className="px-5 py-4 text-xs font-bold text-green-600 uppercase tracking-wider text-right">Total Pay</th>
                    </>
                  )}
                  <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center">
                      <p className="text-slate-400 font-medium">No staff data found for {monthLabel}.</p>
                      <p className="text-slate-300 text-sm mt-1">Try adjusting your filters.</p>
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map(s => {
                    const isExpanded = expandedRow === s.id;
                    return (
                      <Row
                        key={s.id}
                        s={s}
                        isExpanded={isExpanded}
                        onToggle={() => setExpandedRow(isExpanded ? null : s.id)}
                        showPay={viewTab !== "ft"}
                      />
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Row (with expandable daily breakdown placeholder) ────────────────────────

function Row({
  s,
  isExpanded,
  onToggle,
  showPay,
}: {
  s: StaffRow;
  isExpanded: boolean;
  onToggle: () => void;
  showPay: boolean;
}) {
  const initials = s.name
    .split(" ")
    .map(n => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <tr className={`hover:bg-slate-50/50 transition-colors ${isExpanded ? "bg-blue-50/30" : ""}`}>
        <td className="px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
              {initials}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{s.name}</p>
              <p className="text-[10px] text-slate-400">{s.employeeId}</p>
            </div>
          </div>
        </td>
        <td className="px-5 py-4 text-sm text-slate-600 font-medium">{s.branch}</td>
        <td className="px-5 py-4 text-center">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
              s.isPT
                ? "bg-purple-100 text-purple-700 border border-purple-200"
                : "bg-blue-100 text-blue-700 border border-blue-200"
            }`}
          >
            {s.isPT ? "PT" : "FT"}
          </span>
        </td>
        <td className="px-5 py-4 text-center text-sm font-bold text-orange-600">{fmtHrs(s.coachHrs)}</td>
        <td className="px-5 py-4 text-center text-sm font-bold text-indigo-600">{fmtHrs(s.execHrs)}</td>
        <td className="px-5 py-4 text-center text-sm font-black text-blue-600">{fmtHrs(s.totalHrs)}</td>
        {showPay && (
          <>
            <td className="px-5 py-4 text-center text-sm text-slate-500">
              {s.isPT && s.rate ? `RM${s.rate}` : "-"}
            </td>
            <td className="px-5 py-4 text-right text-sm font-black text-green-600">
              {s.isPT ? `RM ${s.totalPay.toFixed(2)}` : "-"}
            </td>
          </>
        )}
        <td className="px-5 py-4 text-center">
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
          </button>
        </td>
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={9} className="p-0">
            <div className="bg-slate-50 border-y border-slate-200 px-5 py-4">
              <p className="text-sm font-bold text-slate-700 mb-2">
                Daily Breakdown: <span className="text-blue-600">{s.name}</span>
              </p>
              <p className="text-xs text-slate-400 italic">
                Per-day hours grid would render here. Backend wiring pending.
              </p>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Toolbar select ───────────────────────────────────────────────────────────

interface ToolbarSelectProps {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  icon?: React.ReactNode;
}

function ToolbarSelect({ value, onChange, options, icon }: ToolbarSelectProps) {
  return (
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none">
          {icon}
        </span>
      )}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`appearance-none ${icon ? "pl-9" : "pl-4"} pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all cursor-pointer`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2364748b' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 10px center",
        }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Page (with AppShell + auth) ──────────────────────────────────────────────

export default function ManpowerCostReportPage() {
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

  const userEmail = session?.user?.email ?? "";
  const userRole = (session?.user as { role?: string } | undefined)?.role ?? "USER";
  const userName = session?.user?.name ?? null;

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <ManpowerCostReportContent />
    </AppShell>
  );
}
