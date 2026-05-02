"use client";

import { useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, ClipboardCopy, Send } from "lucide-react";
import { acceptInductionRequest } from "@/app/induction/actions";
import type { PendingInductionRequestRow } from "@/app/induction/queries";

interface Props {
  request: PendingInductionRequestRow;
}

export function RequestCard({ request }: Props) {
  const [, startTransition] = useTransition();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAccept = () => {
    setPending(true);
    setError(null);
    startTransition(async () => {
      const result = await acceptInductionRequest(request.id);
      setPending(false);
      if (!result.ok) {
        setError(result.error ?? "Failed to accept request.");
        return;
      }
      setGeneratedLink(result.trainingLink ?? null);
    });
  };

  const handleCopy = async () => {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable; ignore.
    }
  };

  const dateChips: string[] = [];
  if (request.startDate) dateChips.push(`Starts ${request.startDate}`);
  if (request.endDate) dateChips.push(`Leaves ${request.endDate}`);

  return (
    <li className="px-6 py-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-900 truncate">{request.fullName}</p>
          <p className="text-xs text-slate-500 truncate">
            {request.email} · {request.position ?? "—"} · {request.departmentName ?? "—"}
          </p>
          {dateChips.length > 0 && (
            <p className="text-xs text-slate-500 mt-0.5">{dateChips.join(" · ")}</p>
          )}
          <p className="text-xs text-slate-500 mt-0.5">
            Triggered by {request.triggeredByName} on{" "}
            {new Date(request.triggeredAt).toLocaleDateString()}
          </p>
        </div>
        {!generatedLink && (
          <button
            type="button"
            onClick={handleAccept}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" aria-hidden="true" />
            {pending ? "Accepting…" : "Accept"}
          </button>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-700 inline-flex items-center gap-1">
          <AlertCircle className="w-3 h-3" aria-hidden="true" />
          {error}
        </p>
      )}

      {generatedLink && (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-xs font-semibold text-emerald-900 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            Training link generated
          </p>
          <div className="mt-2 flex items-stretch gap-2">
            <input
              type="text"
              readOnly
              value={generatedLink}
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1 rounded-md border border-emerald-300 bg-white px-2 py-1.5 text-xs font-mono text-slate-700 select-all"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-white px-2.5 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <ClipboardCopy className="w-3.5 h-3.5" aria-hidden="true" />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
