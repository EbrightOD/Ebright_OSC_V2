"use client";

import { useMemo, useState, useTransition } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock3,
  CalendarDays,
  Hash,
  Tag,
  MessageSquarePlus,
  Send,
  Undo2,
  ChevronDown,
  Check,
  X,
} from "lucide-react";
import type { ApprovalRow } from "./queries";
import { approveLeave, rejectLeave, undoLeaveDecision, saveLeaveRemarks } from "./actions";

type Status = "pending" | "approved" | "rejected" | "cancelled";
type Filter = "All" | "Pending" | "Approved" | "Rejected";

const STATUS_PILL: Record<Status, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  cancelled: "bg-slate-100 text-slate-600 border-slate-200",
};

const STATUS_DOT: Record<Status, string> = {
  pending: "bg-amber-500",
  approved: "bg-emerald-500",
  rejected: "bg-rose-500",
  cancelled: "bg-slate-400",
};

const STATUS_BORDER: Record<Status, string> = {
  pending: "border-l-slate-200",
  approved: "border-l-emerald-500",
  rejected: "border-l-rose-500",
  cancelled: "border-l-slate-300",
};

const STATUS_LABEL: Record<Status, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

const AVATAR_PALETTE = [
  "bg-gradient-to-br from-indigo-500 to-blue-600",
  "bg-gradient-to-br from-emerald-500 to-teal-600",
  "bg-gradient-to-br from-amber-500 to-orange-500",
  "bg-gradient-to-br from-rose-500 to-pink-600",
  "bg-gradient-to-br from-violet-500 to-purple-600",
  "bg-gradient-to-br from-sky-500 to-cyan-600",
];

function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(p => /^[A-Za-z]/.test(p));
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateRange(start: string, end: string): string {
  if (start === end) return formatDate(start);
  return `${formatDate(start)} — ${formatDate(end)}`;
}

const FILTERS: Filter[] = ["All", "Pending", "Approved", "Rejected"];

export default function ManagerApprovalDashboard({
  initialRows,
  hideHeader = false,
}: {
  initialRows: ApprovalRow[];
  hideHeader?: boolean;
}) {
  // Hide cancelled requests by default — they're not actionable
  const actionable = useMemo(
    () => initialRows.filter(r => r.status !== "cancelled"),
    [initialRows],
  );

  const [requests, setRequests] = useState<ApprovalRow[]>(actionable);
  const [filter, setFilter] = useState<Filter>("All");

  const counts = useMemo(() => ({
    Pending: requests.filter(r => r.status === "pending").length,
    Approved: requests.filter(r => r.status === "approved").length,
    Rejected: requests.filter(r => r.status === "rejected").length,
  }), [requests]);

  const visible = useMemo(() => {
    const list =
      filter === "All" ? requests :
      filter === "Pending" ? requests.filter(r => r.status === "pending") :
      filter === "Approved" ? requests.filter(r => r.status === "approved") :
      requests.filter(r => r.status === "rejected");
    const order: Record<Status, number> = { pending: 0, approved: 1, rejected: 2, cancelled: 3 };
    return [...list].sort((a, b) => order[a.status] - order[b.status]);
  }, [requests, filter]);

  const updateLocalStatus = (leaveId: number, status: Status) => {
    setRequests(prev => prev.map(r => (r.leaveId === leaveId ? { ...r, status } : r)));
  };

  const updateLocalRemarks = (leaveId: number, remarks: string) => {
    setRequests(prev =>
      prev.map(r => (r.leaveId === leaveId ? { ...r, remarks: remarks.trim() || null } : r)),
    );
  };

  return (
    <div className="space-y-5">
      {!hideHeader && (
        <header>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
              Leave Approvals
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200">
              <Clock3 className="w-3.5 h-3.5" aria-hidden="true" />
              {counts.Pending} pending
            </span>
          </div>
          <p className="mt-1.5 text-sm text-slate-500">
            Review and respond to leave requests from your team.
          </p>
        </header>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MetricCard label="Pending" value={counts.Pending} tone="amber" icon={Clock3} />
        <MetricCard label="Approved" value={counts.Approved} tone="emerald" icon={CheckCircle2} />
        <MetricCard label="Rejected" value={counts.Rejected} tone="rose" icon={XCircle} />
      </div>

      <div
        role="tablist"
        aria-label="Filter leave requests"
        className="flex flex-wrap items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1.5"
      >
        {FILTERS.map(f => {
          const active = filter === f;
          const count =
            f === "All" ? requests.length :
            f === "Pending" ? counts.Pending :
            f === "Approved" ? counts.Approved : counts.Rejected;
          return (
            <button
              key={f}
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(f)}
              className={[
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer",
                active
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
              ].join(" ")}
            >
              <span>{f}</span>
              <span
                className={[
                  "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold",
                  active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600",
                ].join(" ")}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <EmptyList filter={filter} totalCount={requests.length} />
      ) : (
        <ul className="space-y-3">
          {visible.map(req => (
            <li key={req.leaveId}>
              <RequestCard
                request={req}
                onApprove={() => updateLocalStatus(req.leaveId, "approved")}
                onReject={() => updateLocalStatus(req.leaveId, "rejected")}
                onUndo={() => updateLocalStatus(req.leaveId, "pending")}
                onSaveRemarks={(remarks) => updateLocalRemarks(req.leaveId, remarks)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: number;
  tone: "amber" | "emerald" | "rose";
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

function MetricCard({ label, value, tone, icon: Icon }: MetricCardProps) {
  const tones = {
    amber: { ring: "border-amber-200", bg: "bg-amber-50", iconWrap: "bg-amber-100 text-amber-700", value: "text-amber-700" },
    emerald: { ring: "border-emerald-200", bg: "bg-emerald-50", iconWrap: "bg-emerald-100 text-emerald-700", value: "text-emerald-700" },
    rose: { ring: "border-rose-200", bg: "bg-rose-50", iconWrap: "bg-rose-100 text-rose-700", value: "text-rose-700" },
  }[tone];
  return (
    <div className={`${tones.bg} ${tones.ring} border rounded-2xl p-4 flex items-center gap-4`}>
      <div className={`${tones.iconWrap} w-11 h-11 rounded-xl flex items-center justify-center`}>
        <Icon className="w-5 h-5" aria-hidden="true" />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-semibold ${tones.value} leading-tight`}>{value}</p>
      </div>
    </div>
  );
}

interface RequestCardProps {
  request: ApprovalRow;
  onApprove: () => void;
  onReject: () => void;
  onUndo: () => void;
  onSaveRemarks: (remarks: string) => void;
}

function RequestCard({ request, onApprove, onReject, onUndo, onSaveRemarks }: RequestCardProps) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [draft, setDraft] = useState(request.remarks ?? "");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const status = request.status;
  const isPending = status === "pending";

  const runDecision = async (action: () => Promise<{ ok: boolean; error?: string }>, optimistic: () => void) => {
    setFeedback(null);
    optimistic();
    startTransition(async () => {
      const res = await action();
      if (!res.ok) {
        setFeedback(res.error ?? "Action failed.");
        // Best-effort revert: undo to original status; leave to caller for accuracy
      }
    });
  };

  const handleApprove = () =>
    runDecision(() => approveLeave(request.leaveId), onApprove);

  const handleReject = () =>
    runDecision(() => rejectLeave(request.leaveId), onReject);

  const handleUndo = () =>
    runDecision(() => undoLeaveDecision(request.leaveId), onUndo);

  const handleSendRemarks = () => {
    const trimmed = draft.trim();
    setFeedback(null);
    onSaveRemarks(trimmed);
    startTransition(async () => {
      const res = await saveLeaveRemarks(request.leaveId, trimmed);
      if (res.ok) {
        setFeedback("Note saved");
        setTimeout(() => setFeedback(null), 1800);
      } else {
        setFeedback(res.error ?? "Failed to save note.");
      }
    });
  };

  return (
    <article
      className={[
        "bg-white rounded-2xl border border-slate-200 border-l-4 shadow-sm",
        STATUS_BORDER[status],
      ].join(" ")}
    >
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`${avatarColor(request.employeeName)} w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0 shadow-sm`}
              aria-hidden="true"
            >
              {initials(request.employeeName)}
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-slate-900 truncate">{request.employeeName}</p>
              <p className="text-xs text-slate-500 truncate">
                {request.employeeRole}
                {request.department && request.department !== "—" ? ` · ${request.department}` : ""}
                {" · "}{request.displayId}
              </p>
            </div>
          </div>
          <span
            className={[
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium",
              STATUS_PILL[status],
            ].join(" ")}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} aria-hidden="true" />
            {STATUS_LABEL[status]}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          <MetaBox icon={Tag} label="Leave type" value={request.leaveTypeCode.toUpperCase()} />
          <MetaBox icon={CalendarDays} label="Dates" value={formatDateRange(request.startDate, request.endDate)} />
          <MetaBox icon={Hash} label="Number of days" value={`${request.totalDays} ${request.totalDays === 1 ? "day" : "days"}`} />
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Reason</p>
          <p className="text-sm text-slate-800 leading-relaxed">
            {request.reason ?? <span className="text-slate-400 italic">No reason provided</span>}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Applied: <span className="font-medium text-slate-700 tabular-nums">
              {new Date(request.appliedAt).toLocaleDateString("en-GB")}
            </span>
          </p>
        </div>

        {isPending ? (
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleApprove}
                disabled={pending}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 active:bg-emerald-800 transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" aria-hidden="true" />
                Approve
              </button>
              <button
                onClick={handleReject}
                disabled={pending}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-rose-300 text-rose-700 text-sm font-medium hover:bg-rose-50 active:bg-rose-100 transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4" aria-hidden="true" />
                Reject
              </button>
              <button
                onClick={() => setNoteOpen(o => !o)}
                aria-expanded={noteOpen}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors duration-200 cursor-pointer ml-auto"
              >
                <MessageSquarePlus className="w-4 h-4" aria-hidden="true" />
                Add note
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${noteOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>
            </div>

            {noteOpen && (
              <div className="mt-3 border-t border-slate-100 pt-3">
                <label htmlFor={`note-${request.leaveId}`} className="block text-xs font-medium text-slate-600 mb-1.5">
                  Message to {request.employeeName.split(" ")[0]}
                </label>
                <textarea
                  id={`note-${request.leaveId}`}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={3}
                  placeholder="Optional message — e.g. ask for documentation, approve with conditions..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                />
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-xs text-slate-500" aria-live="polite">
                    {feedback ?? (request.remarks ? "Saved earlier" : "")}
                  </p>
                  <button
                    onClick={handleSendRemarks}
                    disabled={pending || draft.trim().length === 0}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  >
                    <Send className="w-3.5 h-3.5" aria-hidden="true" />
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <p className="text-sm flex items-center gap-2">
              {status === "approved" ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                  <span className="text-slate-700">
                    You <span className="font-semibold text-emerald-700">approved</span> this request
                  </span>
                </>
              ) : status === "rejected" ? (
                <>
                  <XCircle className="w-4 h-4 text-rose-600" aria-hidden="true" />
                  <span className="text-slate-700">
                    You <span className="font-semibold text-rose-700">rejected</span> this request
                  </span>
                </>
              ) : (
                <span className="text-slate-500">{STATUS_LABEL[status]}</span>
              )}
            </p>
            {(status === "approved" || status === "rejected") && (
              <button
                onClick={handleUndo}
                disabled={pending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Undo2 className="w-4 h-4" aria-hidden="true" />
                Undo
              </button>
            )}
          </div>
        )}

        {!isPending && request.remarks && (
          <div className="mt-3 bg-slate-50 border border-slate-100 rounded-xl p-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Note sent</p>
            <p className="text-sm text-slate-800 leading-relaxed">{request.remarks}</p>
          </div>
        )}

        {feedback && !pending && status === "pending" && (
          <p className="mt-2 text-xs text-rose-600" aria-live="polite">{feedback}</p>
        )}
      </div>
    </article>
  );
}

interface MetaBoxProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
}

function MetaBox({ icon: Icon, label, value }: MetaBoxProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-0.5">
        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
        <span>{label}</span>
      </div>
      <p className="text-sm font-medium text-slate-900 truncate" title={value}>{value}</p>
    </div>
  );
}

function EmptyList({ filter, totalCount }: { filter: Filter; totalCount: number }) {
  let message: string;
  if (totalCount === 0) {
    message = "No leave requests in your scope yet.";
  } else if (filter === "Pending") {
    message = "No pending requests — you're all caught up.";
  } else if (filter === "Approved") {
    message = "No approved requests yet.";
  } else if (filter === "Rejected") {
    message = "No rejected requests.";
  } else {
    message = "No leave requests match this filter.";
  }
  return (
    <div className="bg-white border border-slate-200 rounded-2xl py-16 px-4 flex flex-col items-center justify-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
        <CheckCircle2 className="w-6 h-6 text-slate-400" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-slate-700">{message}</p>
    </div>
  );
}
