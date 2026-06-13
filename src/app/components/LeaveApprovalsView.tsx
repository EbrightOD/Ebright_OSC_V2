"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Home, ChevronRight, Inbox } from "lucide-react";
import { approveLeaveRequest, rejectLeaveRequest } from "@/app/attendance/leave/actions";

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

        {mode === "hod" ? <HodTable items={hodItems} /> : <HrTable items={hrItems} />}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <section className="bg-white border border-slate-200 rounded-2xl px-6 py-12 text-center">
      <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
        <Inbox className="w-5 h-5 text-slate-400" aria-hidden="true" />
      </div>
      <p className="mt-3 text-sm font-medium text-slate-900">{message}</p>
    </section>
  );
}

function HodTable({ items }: { items: HodPendingItem[] }) {
  const [isPending, startTransition] = useTransition();
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onApprove = (id: number) => {
    setError(null);
    startTransition(async () => {
      const res = await approveLeaveRequest(id);
      if (!res.ok) setError(res.error ?? "Failed to approve.");
    });
  };

  const onReject = (id: number) => {
    setError(null);
    startTransition(async () => {
      const res = await rejectLeaveRequest(id, reason);
      if (!res.ok) {
        setError(res.error ?? "Failed to reject.");
        return;
      }
      setRejectingId(null);
      setReason("");
    });
  };

  if (items.length === 0) return <EmptyState message="Nothing awaiting your approval." />;

  return (
    <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      {error && (
        <div className="px-6 py-3 bg-red-50 text-sm text-red-700 border-b border-red-100">{error}</div>
      )}
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-[11px] font-semibold tracking-widest text-slate-500 uppercase">
          <tr>
            <th className="text-left px-6 py-3">ID</th>
            <th className="text-left px-6 py-3">Employee</th>
            <th className="text-left px-6 py-3">Type</th>
            <th className="text-left px-6 py-3">Dates</th>
            <th className="text-left px-6 py-3">Days</th>
            <th className="text-left px-6 py-3">Reason</th>
            <th className="text-right px-6 py-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.leaveId} className="border-t border-slate-100 align-top">
              <td className="px-6 py-3 font-medium text-slate-900">{item.displayId}</td>
              <td className="px-6 py-3 text-slate-700">{item.requesterName}</td>
              <td className="px-6 py-3 text-slate-700">{item.leaveTypeName}</td>
              <td className="px-6 py-3 text-slate-500">{item.startDate} → {item.endDate}</td>
              <td className="px-6 py-3 text-slate-700">{item.totalDays}</td>
              <td className="px-6 py-3 text-slate-500 max-w-[16rem] truncate">{item.reason ?? "—"}</td>
              <td className="px-6 py-3">
                {rejectingId === item.leaveId ? (
                  <div className="flex flex-col gap-2 items-end">
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Reason for rejection (required)…"
                      className="w-64 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={isPending || !reason.trim()}
                        onClick={() => onReject(item.leaveId)}
                        className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold disabled:opacity-50 hover:bg-red-700"
                      >
                        Confirm Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingId(null);
                          setReason("");
                        }}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => onApprove(item.leaveId)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold disabled:opacity-50 hover:bg-emerald-700"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => setRejectingId(item.leaveId)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function HrTable({ items }: { items: HrApprovedItem[] }) {
  if (items.length === 0) return <EmptyState message="No approved leave to show." />;

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
