"use client";

import Link from "next/link";
import {
  Home,
  ChevronRight,
  Search,
  UserRound,
  Plus,
  Eye,
} from "lucide-react";

interface ClaimsViewProps {
  userName?: string | null;
}

const cycleSteps = [
  { day: "2nd", label: "Submission" },
  { day: "12th", label: "Approval" },
  { day: "14th", label: "Resubmission" },
  { day: "17th", label: "Final Review" },
  { day: "22nd", label: "Disbursement" },
];

const stats = [
  { label: "SUBMITTED", value: null, dot: "bg-blue-500", text: "text-blue-600" },
  { label: "PENDING", value: null, dot: "bg-amber-500", text: "text-amber-600" },
  { label: "APPROVED", value: null, dot: "bg-emerald-500", text: "text-emerald-600" },
  { label: "REJECTED", value: null, dot: "bg-red-500", text: "text-red-600" },
  { label: "DISBURSED", value: null, dot: "bg-purple-500", text: "text-purple-600" },
  { label: "RECEIVED", value: null, dot: "bg-emerald-500", text: "text-emerald-600" },
];

export default function ClaimsView({ userName }: ClaimsViewProps) {
  const displayName = userName ?? "Admin User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-full bg-slate-50">
      {/* Dark claims banner */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              CLAIMS <span className="text-blue-400">STATUS</span>
            </h1>
            <p className="mt-1 text-xs font-semibold tracking-widest text-slate-400">
              EBRIGHT HRMS
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500 text-white font-bold flex items-center justify-center">
              {initials}
            </div>
            <p className="text-sm font-semibold hidden sm:block">{displayName}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/home" className="flex items-center gap-1 hover:text-slate-900 transition-colors">
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

        {/* Monthly Claim Cycle */}
        <section className="bg-white border border-slate-200 rounded-2xl px-6 py-5">
          <div className="flex items-center justify-center gap-3 mb-4">
            <p className="text-xs font-semibold tracking-widest text-slate-500">
              MONTHLY CLAIM CYCLE
            </p>
            <span className="text-slate-400">—</span>
            <p className="text-sm font-semibold text-slate-900">—</p>
          </div>
          <ol className="flex items-center justify-between gap-2 overflow-x-auto">
            {cycleSteps.map((step, i) => (
              <li key={step.label} className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-slate-50">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" aria-hidden="true" />
                  <span className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">{step.day}</span>
                    <span className="mx-1 text-slate-400">-</span>
                    {step.label}
                  </span>
                </div>
                {i < cycleSteps.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-blue-400 shrink-0" aria-hidden="true" />
                )}
              </li>
            ))}
          </ol>
        </section>

        {/* Stat cards */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-white border border-slate-200 rounded-2xl px-5 py-4"
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${s.dot}`} aria-hidden="true" />
                <p className="text-[11px] font-semibold tracking-widest text-slate-500">
                  {s.label}
                </p>
              </div>
              <p className={`mt-2 text-3xl font-bold ${s.text}`}>
                {s.value ?? "—"}
              </p>
            </div>
          ))}
        </section>

        {/* Toolbar */}
        <section className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search by name, ID, or type…"
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            defaultValue=""
            className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Regions</option>
          </select>
          <select
            defaultValue=""
            className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Months</option>
          </select>
          <button
            type="button"
            className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <UserRound className="w-4 h-4" aria-hidden="true" />
            View Employee Side
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 bg-blue-600 text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Add New Claim
          </button>
        </section>

        {/* Claims table */}
        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
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
                  <td colSpan={8} className="px-6 py-16 text-center text-sm text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Eye className="w-8 h-8 text-slate-300" aria-hidden="true" />
                      <p className="font-medium text-slate-500">No claims to display</p>
                      <p className="text-xs">Claims submitted by employees will appear here.</p>
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
