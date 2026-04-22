"use client";

import { Fragment } from "react";
import Link from "next/link";
import {
  Home,
  ChevronRight,
  Search,
  Plus,
  FileText,
  Inbox,
} from "lucide-react";

const cycleSteps = [
  { day: 2, date: "2nd", label: "Submission" },
  { day: 12, date: "12th", label: "Approval" },
  { day: 14, date: "14th", label: "Resubmission" },
  { day: 17, date: "17th", label: "Final Review" },
  { day: 22, date: "22nd", label: "Disbursement" },
];

const statCards = [
  { key: "submitted", label: "SUBMITTED", dot: "bg-blue-500", text: "text-blue-600", ring: "ring-blue-200 bg-blue-50/40" },
  { key: "pending", label: "PENDING", dot: "bg-amber-500", text: "text-amber-600", ring: "" },
  { key: "approved", label: "APPROVED", dot: "bg-emerald-500", text: "text-emerald-600", ring: "" },
  { key: "rejected", label: "REJECTED", dot: "bg-red-500", text: "text-red-600", ring: "" },
  { key: "disbursed", label: "DISBURSED", dot: "bg-purple-500", text: "text-purple-600", ring: "" },
  { key: "received", label: "RECEIVED", dot: "bg-emerald-500", text: "text-emerald-600", ring: "" },
] as const;

const counts: Record<string, number | null> = {
  submitted: null,
  pending: null,
  approved: null,
  rejected: null,
  disbursed: null,
  received: null,
};

export default function ClaimsView() {
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
              Review, submit, and track expense claims across your organization.
            </p>
          </div>
          <Link
            href="/claim/new"
            className="shrink-0 inline-flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Add New Claim
          </Link>
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
            const value = counts[card.key];
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
                <p className={`mt-2 text-3xl font-bold ${card.text}`}>
                  {value ?? "—"}
                </p>
              </div>
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
              placeholder="Search by claim ID, employee, or type…"
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            aria-label="Filter by branch"
            defaultValue=""
            className="shrink-0 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-40"
          >
            <option value="">All Branches</option>
          </select>

          <select
            aria-label="Filter by month"
            defaultValue=""
            className="shrink-0 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-40"
          >
            <option value="">All Months</option>
          </select>
        </section>

        {/* Claims table */}
        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-slate-900">All Claims</h2>
            </div>
            <p className="text-xs text-slate-500">0 records</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[11px] font-semibold tracking-widest text-slate-500 uppercase">
                <tr>
                  <th className="text-left px-6 py-3">Claim ID</th>
                  <th className="text-left px-6 py-3">Employee</th>
                  <th className="text-left px-6 py-3">Branch</th>
                  <th className="text-left px-6 py-3">Type</th>
                  <th className="text-left px-6 py-3">Amount</th>
                  <th className="text-left px-6 py-3">Date Submitted</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-right px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={8} className="px-6 py-20">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                        <Inbox className="w-6 h-6 text-slate-400" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          No claims yet
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Submitted claims will appear here once available.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
