"use client";

import Link from "next/link";
import { Home, ChevronRight, Inbox } from "lucide-react";
import HodApprovalTable from "@/app/components/HodApprovalTable";

export interface HodPendingItem {
  leaveId: number;
  displayId: string;
  requesterName: string;
  departmentName: string | null;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string | null;
  appliedAt: string;
}

export interface HrApprovedItem {
  leaveId: number;
  displayId: string;
  requesterName: string;
  departmentName: string | null;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  approvedBy: string | null;
  approvedAt: string | null;
}

export default function LeaveApprovalsView({
  mode,
  hodItems = [],
  hrItems = [],
}: {
  mode: "hod" | "hr";
  hodItems?: HodPendingItem[];
  hrItems?: HrApprovedItem[];
}) {
  const title = mode === "hod" ? "Leave Approvals" : "Approved Leave";
  const subtitle =
    mode === "hod"
      ? "Approve or reject pending requests from your department."
      : "Leave requests approved across the company.";

  return (
    <div className="min-h-full bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 pt-4 pb-10 space-y-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/home" className="flex items-center gap-1 hover:text-slate-900 transition-colors">
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>Home</span>
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <Link href="/attendance" className="hover:text-slate-900 transition-colors">Attendance</Link>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <span className="text-slate-900 font-medium">Approvals</span>
        </nav>

        <header>
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </header>

        {mode === "hod" ? <HodApprovalTable items={hodItems} /> : <HrTable items={hrItems} />}
      </div>
    </div>
  );
}

function HrTable({ items }: { items: HrApprovedItem[] }) {
  if (items.length === 0) {
    return (
      <section className="bg-white border border-slate-200 rounded-2xl px-6 py-12 text-center">
        <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
          <Inbox className="w-5 h-5 text-slate-400" aria-hidden="true" />
        </div>
        <p className="mt-3 text-sm font-medium text-slate-900">No approved leave to show.</p>
      </section>
    );
  }

  return (
    <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-[11px] font-semibold tracking-widest text-slate-500 uppercase">
          <tr>
            <th className="text-left px-6 py-3">ID</th>
            <th className="text-left px-6 py-3">Employee</th>
            <th className="text-left px-6 py-3">Department</th>
            <th className="text-left px-6 py-3">Type</th>
            <th className="text-left px-6 py-3">Dates</th>
            <th className="text-left px-6 py-3">Days</th>
            <th className="text-left px-6 py-3">Approved by</th>
            <th className="text-left px-6 py-3">Approved on</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.leaveId} className="border-t border-slate-100">
              <td className="px-6 py-3 font-medium text-slate-900">{item.displayId}</td>
              <td className="px-6 py-3 text-slate-700">{item.requesterName}</td>
              <td className="px-6 py-3 text-slate-500">{item.departmentName ?? "—"}</td>
              <td className="px-6 py-3 text-slate-700">{item.leaveTypeName}</td>
              <td className="px-6 py-3 text-slate-500">{item.startDate} → {item.endDate}</td>
              <td className="px-6 py-3 text-slate-700">{item.totalDays}</td>
              <td className="px-6 py-3 text-slate-500">{item.approvedBy ?? "—"}</td>
              <td className="px-6 py-3 text-slate-500">{item.approvedAt ? item.approvedAt.slice(0, 10) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
