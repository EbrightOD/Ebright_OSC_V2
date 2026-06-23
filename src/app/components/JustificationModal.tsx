"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import { saveJustification, deleteJustification, JUSTIFICATION_REASONS } from "@/app/attendance/justifications/actions";

export interface JustificationTarget {
  userId: number;
  employeeName: string;
  employeeCode: string | null;
  /** YYYY-MM-DD (MYT). */
  date: string;
  /** Existing justification, if any. */
  existing?: {
    id: number;
    reason: string;
    note: string | null;
  } | null;
}

export default function JustificationModal({
  target,
  onClose,
}: {
  target: JustificationTarget | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Reset draft when the target changes (different person/day clicked).
  useEffect(() => {
    if (!target) return;
    setReason(target.existing?.reason ?? JUSTIFICATION_REASONS[0].value);
    setNote(target.existing?.note ?? "");
    setError(null);
  }, [target]);

  if (!target) return null;

  const onSave = () => {
    setError(null);
    const fd = new FormData();
    fd.set("user_id", String(target.userId));
    fd.set("date", target.date);
    fd.set("reason", reason);
    if (note.trim()) fd.set("note", note.trim());
    startTransition(async () => {
      const res = await saveJustification(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
      onClose();
    });
  };

  const onDelete = () => {
    if (!target.existing) return;
    setError(null);
    const fd = new FormData();
    fd.set("id", String(target.existing.id));
    startTransition(async () => {
      const res = await deleteJustification(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
      onClose();
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2 px-5 py-4 border-b border-slate-200">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900">
              {target.existing ? "Edit justification" : "Justify No Record"}
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5 truncate">
              {target.employeeName}
              {target.employeeCode && (
                <span className="ml-1 text-slate-400 font-mono">· {target.employeeCode}</span>
              )}
              <span className="ml-1 text-slate-400">· {target.date}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              {JUSTIFICATION_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Note <span className="font-medium text-slate-400 normal-case tracking-normal">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Anything else worth recording — e.g. 'on-site visit at Ampang' or 'scanner offline'..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm rounded-xl px-3 py-2.5 font-medium bg-rose-50 text-rose-700 border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 px-5 py-3 bg-slate-50 border-t border-slate-200">
          {target.existing ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              Remove
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="h-9 px-3 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              {isPending ? "Saving…" : target.existing ? "Update" : "Justify"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
