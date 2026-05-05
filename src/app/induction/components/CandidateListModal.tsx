"use client";

import type { OnboardingCandidateRow } from "@/app/induction/queries";

export function CandidateListModal({
  title,
  candidates,
  onClose,
}: {
  title: string;
  candidates: OnboardingCandidateRow[];
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-lg bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {candidates.length === 0 ? (
          <p className="text-gray-500">No candidates found.</p>
        ) : (
          <div className="space-y-3">
            {candidates.map((candidate) => (
              <div
                key={candidate.id}
                className="rounded-lg border p-4 hover:bg-gray-50"
              >
                <p className="font-semibold">{candidate.name}</p>
                <p className="text-sm text-gray-600">{candidate.position}</p>
                <p className="text-sm text-gray-600">
                  {candidate.departmentBranch}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Start: {candidate.startDate}
                  {candidate.endDate && ` · End: ${candidate.endDate}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
