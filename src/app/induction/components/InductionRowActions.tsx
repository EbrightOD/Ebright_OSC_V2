"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { regenerateInductionToken } from "@/app/induction/actions";

interface InductionRowActionsProps {
  inductionProfileId: number;
  linkToken: string;
}

export default function InductionRowActions({
  inductionProfileId,
  linkToken,
}: InductionRowActionsProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function buildLink(token: string): string {
    if (typeof window === "undefined") return `/induction/${token}`;
    return `${window.location.origin}/induction/${token}`;
  }

  async function handleCopy(token: string) {
    try {
      await navigator.clipboard.writeText(buildLink(token));
      setFeedback({ kind: "ok", msg: "Link copied to clipboard." });
    } catch {
      setFeedback({ kind: "err", msg: "Could not copy. Select the link manually." });
    }
    setTimeout(() => setFeedback(null), 2500);
  }

  function handleRegenerate() {
    startTransition(async () => {
      const result = await regenerateInductionToken(inductionProfileId);
      if (result.ok) {
        setFeedback({ kind: "ok", msg: "New link generated." });
        router.refresh();
      } else {
        setFeedback({ kind: "err", msg: result.error ?? "Failed to regenerate token." });
      }
      setTimeout(() => setFeedback(null), 3000);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleCopy(linkToken)}
          className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Copy link
        </button>
        <button
          type="button"
          onClick={handleRegenerate}
          disabled={pending}
          className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {pending ? "Regenerating…" : "Regenerate"}
        </button>
      </div>
      {feedback && (
        <span
          className={`text-[11px] ${
            feedback.kind === "ok" ? "text-emerald-600" : "text-red-600"
          }`}
          role="status"
        >
          {feedback.msg}
        </span>
      )}
    </div>
  );
}
