"use client";

import { useState } from "react";
import { CandidateListModal } from "./CandidateListModal";
import type { CandidateType, OnboardingCandidateRow } from "@/app/induction/queries";

const COLOR_CLASSES: Record<string, string> = {
  green: "bg-green-50 border-green-200 text-green-800",
  red: "bg-red-50 border-red-200 text-red-800",
  blue: "bg-blue-50 border-blue-200 text-blue-800",
  purple: "bg-purple-50 border-purple-200 text-purple-800",
};

export function CandidateCountCard({
  title,
  subtitle,
  count,
  color,
  type,
  candidates,
}: {
  title: string;
  subtitle: string;
  count: number;
  color: "green" | "red" | "blue" | "purple";
  type: CandidateType;
  candidates: OnboardingCandidateRow[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`rounded-lg border-2 p-6 text-left transition hover:shadow-lg ${COLOR_CLASSES[color]}`}
      >
        <p className="text-sm font-semibold opacity-75">{title}</p>
        <p className="mb-3 text-xs opacity-60">{subtitle}</p>
        <p className="mb-4 text-4xl font-bold">{count}</p>
        <p className="text-xs font-medium underline">CLICK TO VIEW DETAIL</p>
      </button>

      {open && (
        <CandidateListModal
          title={title}
          candidates={candidates}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
