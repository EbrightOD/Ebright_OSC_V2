"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Home,
  ChevronRight,
  Search,
  Plus,
  Umbrella,
  Inbox,
  Eye,
} from "lucide-react";

export interface LeaveRow {
  leaveId: number;
  displayId: string;
  leaveTypeCode: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string | null;
  status: string;
  appliedAt: string;
}

export interface LeaveStatusCounts {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
] as const;

const STATUS_BADGE: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  pending: { bg: "#FFFBEB", text: "#92400E", dot: "#F59E0B", label: "Pending" },
  approved: { bg: "#ECFDF5", text: "#047857", dot: "#10B981", label: "Approved" },
  rejected: { bg: "#FEF2F2", text: "#991B1B", dot: "#EF4444", label: "Rejected" },
  cancelled: { bg: "#F1F5F9", text: "#475569", dot: "#94A3B8", label: "Cancelled" },
};

const statCards = [
  { key: "total", label: "TOTAL", dot: "bg-blue-500", text: "text-blue-600", ring: "ring-blue-200 bg-blue-50/40" },
  { key: "pending", label: "PENDING", dot: "bg-amber-500", text: "text-amber-600", ring: "" },
  { key: "approved", label: "APPROVED", dot: "bg-emerald-500", text: "text-emerald-600", ring: "" },
  { key: "rejected", label: "REJECTED", dot: "bg-red-500", text: "text-red-600", ring: "" },
  { key: "cancelled", label: "CANCELLED", dot: "bg-slate-400", text: "text-slate-600", ring: "" },
] as const;

export default function LeaveRequestsView({
  rows = [],
  counts,
}: {
  rows?: LeaveRow[];
  counts?: LeaveStatusCounts;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");

  const typeOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of rows) {
      if (!seen.has(r.leaveTypeCode)) seen.set(r.leaveTypeCode, r.leaveTypeName);
    }
    return Array.from(seen, ([code, name]) => ({ code, name }));
  }, [rows]);

  const monthOptions = useMemo(() => {
    const set = new Set(rows.map((r) => r.startDate.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (typeFilter && r.leaveTypeCode !== typeFilter) return false;
      if (monthFilter && !r.startDate.startsWith(monthFilter)) return false;
      if (!q) return true;
      return (
        r.displayId.toLowerCase().includes(q) ||
        r.leaveTypeName.toLowerCase().includes(q) ||
        (r.reason?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [rows, query, statusFilter, typeFilter, monthFilter]);

  const displayCounts: Record<string, number> = {
    total: counts?.total ?? 0,
    pending: counts?.pending ?? 0,
    approved: counts?.approved ?? 0,
    rejected: counts?.rejected ?? 0,
    cancelled: counts?.cancelled ?? 0,
  };

  return (
    <div className="min-h-full bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 pt-4 pb-10 space-y-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/home" className="flex items-center gap-1 hover:text-slate-900 transition-colors">
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>Home</span>
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <Link href="/dashboards/hrms" className="hover:text-slate-900 transition-colors">HRMS</Link>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <Link href="/attendance" className="hover:text-slate-900 transition-colors">Attendance</Link>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <span className="text-slate-900 font-medium">Leave</span>
        </nav>

        {/* Page header */}
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
              Leave Requests
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Apply for leave and track the status of your requests.
            </p>
          </div>
          <Link
            href="/attendance/leave/new"
            className="shrink-0 inline-flex items-center justify-center gap-2 bg-emerald-600 text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Apply for Leave
          </Link>
        </header>

        {/* Stat cards */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
            gap: "1rem",
          }}
        >
          {statCards.map((card) => {
            const value = displayCounts[card.key];
            return (
              <div
                key={card.key}
                className={`bg-white border border-slate-200 rounded-2xl px-5 py-4 ${card.ring}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${card.dot}`} aria-hidden="true" />
                  <p className="text-[11px] font-semibold tracking-widest text-slate-500">
                    {card.label}
                  </p>
                </div>
                <p className={`mt-2 text-3xl font-bold ${card.text}`}>{value}</p>
              </div>
            );
          })}
        </section>

        {/* Filters */}
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
              placeholder="Search by ID, type, or reason…"
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="shrink-0 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-36"
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by leave type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="shrink-0 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-40"
          >
            <option value="">All Types</option>
            {typeOptions.map((t) => (
              <option key={t.code} value={t.code}>
                {t.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="shrink-0 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-36"
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

        {/* Leave table */}
        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Umbrella className="w-4 h-4 text-slate-500" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-slate-900">My Leave Requests</h2>
            </div>
            <p className="text-xs text-slate-500">
              {filtered.length} {filtered.length === 1 ? "record" : "records"}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[11px] font-semibold tracking-widest text-slate-500 uppercase">
                <tr>
                  <th className="text-left px-6 py-3">ID</th>
                  <th className="text-left px-6 py-3">Type</th>
                  <th className="text-left px-6 py-3">From</th>
                  <th className="text-left px-6 py-3">To</th>
                  <th className="text-left px-6 py-3">Days</th>
                  <th className="text-left px-6 py-3">Reason</th>
                  <th className="text-left px-6 py-3">Applied</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-right px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-20">
                      <div className="flex flex-col items-center gap-3 text-center">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                          <Inbox className="w-6 h-6 text-slate-400" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700">
                            {rows.length === 0
                              ? "No leave requests yet"
                              : "No requests match your filters"}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {rows.length === 0
                              ? "Apply for leave to see it listed here."
                              : "Try adjusting the search or filters."}
                          </p>
                        </div>
                        {rows.length === 0 && (
                          <Link
                            href="/attendance/leave/new"
                            className="mt-2 inline-flex items-center gap-2 bg-emerald-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-emerald-700 transition-colors"
                          >
                            <Plus className="w-4 h-4" aria-hidden="true" />
                            Apply for Leave
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => {
                    const badge = STATUS_BADGE[r.status] ?? {
                      bg: "#F1F5F9",
                      text: "#334155",
                      dot: "#64748B",
                      label: r.status,
                    };
                    return (
                      <tr
                        key={r.leaveId}
                        className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="px-6 py-4 font-semibold text-emerald-700">
                          {r.displayId}
                        </td>
                        <td className="px-6 py-4 text-slate-700">{r.leaveTypeName}</td>
                        <td className="px-6 py-4 text-slate-600 tabular-nums">
                          {new Date(r.startDate).toLocaleDateString("en-GB")}
                        </td>
                        <td className="px-6 py-4 text-slate-600 tabular-nums">
                          {new Date(r.endDate).toLocaleDateString("en-GB")}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-900 tabular-nums">
                          {r.totalDays}
                        </td>
                        <td className="px-6 py-4 text-slate-600 max-w-[240px] truncate" title={r.reason ?? ""}>
                          {r.reason ?? <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-6 py-4 text-slate-500 tabular-nums">
                          {new Date(r.appliedAt).toLocaleDateString("en-GB")}
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
                            href={`/attendance/leave/${r.leaveId}`}
                            aria-label={`View ${r.displayId}`}
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
