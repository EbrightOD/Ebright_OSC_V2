// Client-safe helpers + union types for the offboarding stage flow.
// NO server-only / prisma imports here — this file is imported by both
// server components (queries.ts) AND client components
// (OffboardingCaseDetailView.tsx). Anything that needs DB access lives
// in queries.ts; this file is pure data + functions.

export type OffboardingCaseType = "Resign" | "ContractEnded";
export type OffboardingStatus = "Pending" | "InProgress" | "Completed";
export type OffboardingStage =
  | "Trigger"
  | "HRReview"
  | "ExitInterview"
  | "Checklist"
  | "SignOff"
  | "Done";

export const STAGE_ORDER: OffboardingStage[] = [
  "Trigger",
  "HRReview",
  "ExitInterview",
  "Checklist",
  "SignOff",
  "Done",
];

export function stageIndex(stage: OffboardingStage): number {
  return STAGE_ORDER.indexOf(stage);
}

export function isStageBefore(
  a: OffboardingStage,
  b: OffboardingStage,
): boolean {
  return stageIndex(a) < stageIndex(b);
}
