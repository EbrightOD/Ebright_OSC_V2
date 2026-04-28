"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import {
  Home,
  ChevronRight,
  Search,
  Plus,
  FileText,
  Inbox,
  Eye,
} from "lucide-react";

export interface ClaimRow {
  claimId: number;
  displayId: string;
  employeeName: string;
  branch: string;
  claimType: string;
  amount: number;
  claimDate: string;
  status: string;
}

export interface StatusCounts {
  submitted: number;
  pending: number;
  approved: number;
  rejected: number;
  disbursed: number;
  received: number;
}

export interface OrgOption {
  code: string;
  label: string;
  kind: "branch" | "department";
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "disbursed", label: "Disbursed" },
  { value: "received", label: "Received" },
] as const;

const TYPE_OPTIONS = [
  { value: "sales", label: "Sales" },
  { value: "health", label: "Health" },
  { value: "transport", label: "Transport" },
] as const;

const cycleSteps = [
  { day: 2, date: "2nd", label: "Submission" },
  { day: 12, date: "12th", label: "Approval" },
  { day: 14, date: "14th", label: "Resubmission" },
  { day: 17, date: "17th", label: "Final Review" },
  { day: 22, date: "22nd", label: "Disbursement" },
];

const statCards = [
  { key: "submitted", label: "SUBMITTED", dot: "bg-blue-500", text: "text-blue-600", activeRing: "ring-blue-300 bg-blue-50/50 border-blue-200" },
  { key: "pending", label: "PENDING", dot: "bg-amber-500", text: "text-amber-600", activeRing: "ring-amber-300 bg-amber-50/50 border-amber-200" },
  { key: "approved", label: "APPROVED", dot: "bg-emerald-500", text: "text-emerald-600", activeRing: "ring-emerald-300 bg-emerald-50/50 border-emerald-200" },
  { key: "rejected", label: "REJECTED", dot: "bg-red-500", text: "text-red-600", activeRing: "ring-red-300 bg-red-50/50 border-red-200" },
  { key: "disbursed", label: "DISBURSED", dot: "bg-purple-500", text: "text-purple-600", activeRing: "ring-purple-300 bg-purple-50/50 border-purple-200" },
  { key: "received", label: "RECEIVED", dot: "bg-emerald-500", text: "text-emerald-600", activeRing: "ring-emerald-300 bg-emerald-50/50 border-emerald-200" },
] as const;

const STATUS_BADGE: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  pending: { bg: "#FFFBEB", text: "#92400E", dot: "#F59E0B", label: "Pending" },
  approved: { bg: "#ECFDF5", text: "#047857", dot: "#10B981", label: "Approved" },
  rejected: { bg: "#FEF2F2", text: "#991B1B", dot: "#EF4444", label: "Rejected" },
  disbursed: { bg: "#FAF5FF", text: "#6B21A8", dot: "#A855F7", label: "Disbursed" },
  received: { bg: "#ECFDF5", text: "#047857", dot: "#10B981", label: "Received" },
};

const TYPE_LABEL: Record<string, string> = {
  sales: "Sales Claim",
  health: "Health Claim",
  transport: "Transport Claim",
};

export default function ClaimsView({
  claims = [],
  counts,
  isFinance = false,
  isSuperadmin = false,
  orgOptions = [],
}: {
  claims?: ClaimRow[];
  counts?: StatusCounts;
  isFinance?: boolean;
  isSuperadmin?: boolean;
  orgOptions?: OrgOption[];
}) {
  const [query, setQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const monthOptions = useMemo(() => {
    const set = new Set(claims.map((c) => c.claimDate.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [claims]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return claims.filter((c) => {
      if (isFinance && branchFilter && c.branch !== branchFilter) return false;
      if (monthFilter && !c.claimDate.startsWith(monthFilter)) return false;
      if (statusFilter && c.status !== statusFilter) return false;
      if (typeFilter && c.claimType !== typeFilter) return false;
      if (!q) return true;
      return (
        c.displayId.toLowerCase().includes(q) ||
        c.employeeName.toLowerCase().includes(q) ||
        c.claimType.toLowerCase().includes(q)
      );
    });
  }, [claims, query, branchFilter, monthFilter, statusFilter, typeFilter, isFinance]);

  const displayCounts: Record<string, number> = {
    submitted: counts?.submitted ?? 0,
    pending: counts?.pending ?? 0,
    approved: counts?.approved ?? 0,
    rejected: counts?.rejected ?? 0,
    disbursed: counts?.disbursed ?? 0,
    received: counts?.received ?? 0,
  };
  const today = new Date();
  const monthLabel = today.toLocaleString("en-US", { month: "long", year: "numeric" });
  const currentDay = today.getDate();
  const activeStep =
    cycleSteps.find((s) => s.day >= currentDay)?.day ?? cycleSteps[cycleSteps.length - 1].day;

  return (
    <div className="min-h-full bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 pt-4 pb-10 space-y-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500">
          <Link
            href="/home"
            className="flex items-center gap-1 hover:text-slate-900 transition-colors"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>Home</span>
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <Link href="/dashboards/hrms" className="hover:text-slate-900 transition-colors">
            HRMS
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <span className="text-slate-900 font-medium">Claims</span>
        </nav>

        {/* Page header */}
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
              Claims
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {isFinance
                ? "Review and approve expense claims from all employees."
                : "Submit and track your expense claims."}
            </p>
          </div>
          {(!isFinance || isSuperadmin) && (
            <Link
              href="/claim/new"
              className="shrink-0 inline-flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Add New Claim
            </Link>
          )}
        </header>

        {/* Monthly Claim Cycle */}
        <section
          aria-labelledby="cycle-heading"
          className="bg-white border border-slate-200 rounded-2xl px-6 py-6"
        >
          <div className="flex items-center justify-center flex-wrap gap-3 mb-6">
            <h2
              id="cycle-heading"
              className="text-xs font-semibold tracking-widest text-slate-500 uppercase"
            >
              Monthly Claim Cycle
            </h2>
            <span className="text-slate-300">—</span>
            <p className="text-sm font-semibold text-slate-800">{monthLabel}</p>
            {cycleSteps.some((s) => s.day === currentDay) && (
              <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-semibold">
                Deadline today!
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
            {cycleSteps.map((step, i) => {
              const isPast = currentDay > step.day;
              const isActive = step.day === activeStep;
              return (
                <Fragment key={step.label}>
                  <div
                    style={{ flexShrink: 0 }}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border whitespace-nowrap transition-all ${
                      isActive
                        ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isActive ? "bg-emerald-500" : isPast ? "bg-blue-400" : "bg-slate-400"
                      }`}
                      aria-hidden="true"
                    />
                    <p
                      className={`text-sm ${
                        isActive
                          ? "text-emerald-700 font-semibold"
                          : "text-slate-600"
                      }`}
                    >
                      <span className="font-semibold">{step.date}</span>
                      <span className="mx-1 text-slate-400">-</span>
                      {step.label}
                    </p>
                  </div>
                  {i < cycleSteps.length - 1 && (
                    <div
                      aria-hidden="true"
                      style={{
                        flex: "1 1 0%",
                        height: "2px",
                        margin: "0 8px",
                        backgroundColor: isPast ? "#60a5fa" : "#bfdbfe",
                      }}
                    />
                  )}
                </Fragment>
              );
            })}
          </div>
        </section>

        {/* Stat cards */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
            gap: "1rem",
          }}
        >
          {statCards.map((card) => {
            const value = displayCounts[card.key];
            const isActive =
              card.key === "submitted" ? statusFilter === "" : statusFilter === card.key;
            const onClick = () => {
              if (card.key === "submitted") {
                setStatusFilter("");
              } else {
                setStatusFilter(statusFilter === card.key ? "" : card.key);
              }
            };
            return (
              <button
                key={card.key}
                type="button"
                onClick={onClick}
                aria-pressed={isActive}
                className={`text-left bg-white border rounded-2xl px-5 py-4 transition-all hover:border-slate-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  isActive
                    ? `ring-2 ring-offset-1 shadow-sm ${card.activeRing}`
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${card.dot}`} aria-hidden="true" />
                  <p className="text-[11px] font-semibold tracking-widest text-slate-500">
                    {card.label}
                  </p>
                </div>
                <p className={`mt-2 text-3xl font-bold ${card.text}`}>{value}</p>
              </button>
            );
          })}
        </section>

        {/* Filters + action — single row */}
        <section className="flex items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                isFinance
                  ? "Search by claim ID, employee, or type…"
                  : "Search by claim ID or type…"
              }
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="shrink-0 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-36"
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="shrink-0 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
          >
            <option value="">All Types</option>
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          {isFinance && (
            <select
              aria-label="Filter by branch or department"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="shrink-0 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
            >
              <option value="">All Branches / Depts</option>
              {orgOptions.filter((o) => o.kind === "branch").length > 0 && (
                <optgroup label="Branches">
                  {orgOptions
                    .filter((o) => o.kind === "branch")
                    .map((o) => (
                      <option key={`b-${o.code}`} value={o.code}>
                        {o.label}
                      </option>
                    ))}
                </optgroup>
              )}
              {orgOptions.filter((o) => o.kind === "department").length > 0 && (
                <optgroup label="Departments">
                  {orgOptions
                    .filter((o) => o.kind === "department")
                    .map((o) => (
                      <option key={`d-${o.code}`} value={o.code}>
                        {o.label}
                      </option>
                    ))}
                </optgroup>
              )}
            </select>
          )}

          <select
            aria-label="Filter by month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="shrink-0 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-36"
          >
            <option value="">All Months</option>
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                {new Date(m + "-01").toLocaleString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </option>
            ))}
          </select>
        </section>

        {/* Claims table */}
        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-slate-900">All Claims</h2>
            </div>
            <p className="text-xs text-slate-500">
              {filtered.length} {filtered.length === 1 ? "record" : "records"}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[11px] font-semibold tracking-widest text-slate-500 uppercase">
                <tr>
                  <th className="text-left px-6 py-3">Claim ID</th>
                  {isFinance && <th className="text-left px-6 py-3">Employee</th>}
                  {isFinance && <th className="text-left px-6 py-3">Branch</th>}
                  <th className="text-left px-6 py-3">Type</th>
                  <th className="text-left px-6 py-3">Amount</th>
                  <th className="text-left px-6 py-3">Date Submitted</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-right px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={isFinance ? 8 : 6} className="px-6 py-20">
                      <div className="flex flex-col items-center gap-3 text-center">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                          <Inbox className="w-6 h-6 text-slate-400" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700">
                            {claims.length === 0
                              ? "No claims yet"
                              : "No claims match your filters"}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {claims.length === 0
                              ? "Submitted claims will appear here once available."
                              : "Try adjusting the search or filters."}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => {
                    const badge = STATUS_BADGE[c.status] ?? {
                      bg: "#F1F5F9",
                      text: "#334155",
                      dot: "#64748B",
                      label: c.status,
                    };
                    return (
                      <tr
                        key={c.claimId}
                        className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="px-6 py-4 font-semibold text-blue-600">
                          {c.displayId}
                        </td>
                        {isFinance && (
                          <td className="px-6 py-4 text-slate-800">{c.employeeName}</td>
                        )}
                        {isFinance && (
                          <td className="px-6 py-4 text-slate-600">{c.branch}</td>
                        )}
                        <td className="px-6 py-4 text-slate-700">
                          {TYPE_LABEL[c.claimType] ?? c.claimType}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-900 tabular-nums">
                          RM {c.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-slate-600 tabular-nums">
                          {new Date(c.claimDate).toLocaleDateString("en-GB")}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                            style={{ backgroundColor: badge.bg, color: badge.text }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: badge.dot }}
                              aria-hidden="true"
                            />
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/claim/${c.claimId}`}
                            aria-label={`View ${c.displayId}`}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                          >
                            <Eye className="w-4 h-4" aria-hidden="true" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
