import "server-only";
import { prisma } from "@/lib/prisma";
import {
  type OffboardingCaseType,
  type OffboardingStatus,
  type OffboardingStage,
} from "@/lib/offboarding/stages";

// Re-export the client-safe types so existing callers that imported
// them from queries.ts keep working without changes. The runtime
// helpers (stageIndex, isStageBefore, STAGE_ORDER) MUST be imported
// directly from "@/lib/offboarding/stages" by client components to
// avoid pulling this server-only file into the browser bundle.
export type { OffboardingCaseType, OffboardingStatus, OffboardingStage };

// ============================================================
// Offboarding case queries — server-side fetchers for the HR
// dashboard list view + case detail page (read-only in PR1).
// ============================================================

export interface OffboardingCaseRow {
  id: number;
  userId: number;
  employeeName: string;
  employeeEmail: string;
  departmentName: string | null;
  branchCode: string | null;
  caseType: OffboardingCaseType;
  status: OffboardingStatus;
  currentStage: OffboardingStage;
  lastWorkingDay: string | null;
  /** Days from today until last_working_day (negative if past). null if unset. */
  daysUntilLastDay: number | null;
  /** Assignment (amendment): HR officer + supervisor. */
  assignedHrId: number | null;
  assignedHrName: string | null;
  supervisorName: string | null;
}

export interface OffboardingStats {
  totalActive: number;
  pendingAction: number;
  completed: number;
  endingSoon: number;
}

export interface OffboardingChecklistRow {
  id: number;
  itemKey: string;
  title: string;
  actorRole: string;
  status: string;
  completedAt: string | null;
  completedByName: string | null;
  notes: string | null;
  linkedClaimId: number | null;
}

export interface OffboardingAuditRow {
  id: number;
  actorName: string | null;
  action: string;
  stage: string | null;
  details: unknown;
  createdAt: string;
}

export interface OffboardingCaseDetail {
  id: number;
  caseType: OffboardingCaseType;
  status: OffboardingStatus;
  currentStage: OffboardingStage;
  // The staff member
  user: {
    id: number;
    name: string;
    email: string;
    departmentName: string | null;
    branchCode: string | null;
    branchName: string | null;
    position: string | null;
  };
  // Assignment (amendment): HR officer handling this case. The supervisor is
  // the `supervisor` field below (reuses supervisor_user_id).
  assignedHr: { id: number; name: string; email: string } | null;
  // Stage 1 — HR Review
  lastWorkingDay: string | null;
  exitInterviewDate: string | null;
  exitInterviewTime: string | null;
  exitInterviewLocation: string | null;
  // Stage 2 — Exit Interview
  exitInterviewCompletedAt: string | null;
  exitInterviewNotes: string | null;
  exitInterviewOutcome: string | null;
  // Trigger — Contract Ended
  supervisorDecision: string | null;
  supervisorDecisionAt: string | null;
  // Trigger — Resign
  resignationLetterFileId: string | null;
  resignedAt: string | null;
  // Stage 4 — Sign-off
  supervisor: { id: number; name: string; email: string } | null;
  supervisorSignoffStatus: string | null;
  supervisorSignoffAt: string | null;
  supervisorRemarks: string | null;
  // Stage 5 — Finance
  financeRemarks: string | null;
  finalPayBreakdown: unknown;
  financeProcessedAt: string | null;
  financeProcessedByName: string | null;
  // Bookkeeping
  createdByName: string;
  createdAt: string;
  completedAt: string | null;
  checklist: OffboardingChecklistRow[];
  auditLog: OffboardingAuditRow[];
}

function daysBetween(target: Date, from: Date): number {
  const ms = target.getTime() - from.getTime();
  return Math.round(ms / 86_400_000);
}

/**
 * List all offboarding cases for the HR dashboard table. Ordered by the
 * most-actionable first: pending action first, then in progress, then
 * completed; within each group, soonest last working day first.
 */
export async function listOffboardingCases(): Promise<OffboardingCaseRow[]> {
  const rows = await prisma.offboarding_case.findMany({
    include: {
      user: {
        include: {
          user_profile: { select: { full_name: true } },
          employment: {
            where: { status: { in: ["active", "onboarding"] } },
            orderBy: { start_date: "desc" },
            take: 1,
            include: {
              branch: { select: { branch_code: true } },
              department: { select: { department_name: true } },
            },
          },
        },
      },
      assigned_hr: { select: { email: true, user_profile: { select: { full_name: true } } } },
      supervisor: { select: { email: true, user_profile: { select: { full_name: true } } } },
    },
    orderBy: { created_at: "desc" },
  });

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    employeeName: r.user.user_profile?.full_name ?? r.user.email,
    employeeEmail: r.user.email,
    departmentName: r.user.employment[0]?.department?.department_name ?? null,
    branchCode: r.user.employment[0]?.branch?.branch_code ?? null,
    caseType: r.case_type as OffboardingCaseType,
    status: r.status as OffboardingStatus,
    currentStage: r.current_stage as OffboardingStage,
    lastWorkingDay: r.last_working_day
      ? r.last_working_day.toISOString().slice(0, 10)
      : null,
    daysUntilLastDay: r.last_working_day
      ? daysBetween(r.last_working_day, today)
      : null,
    assignedHrId: r.assigned_hr_id,
    assignedHrName:
      r.assigned_hr?.user_profile?.full_name ?? r.assigned_hr?.email ?? null,
    supervisorName:
      r.supervisor?.user_profile?.full_name ?? r.supervisor?.email ?? null,
  }));
}

/**
 * Stats for the 4 dashboard cards. Computed inline rather than in the
 * DB so we can label "ending soon" with the same 30-day window the spec
 * uses (could move to a SQL window function later if perf matters).
 */
export async function computeOffboardingStats(): Promise<OffboardingStats> {
  const rows = await listOffboardingCases();
  const totalActive = rows.filter((r) => r.status !== "Completed").length;
  // "Pending Action" — anything not yet at Done. The spec doesn't define
  // it precisely; we use "in progress at a non-terminal stage" as a
  // reasonable proxy.
  const pendingAction = rows.filter(
    (r) =>
      r.status === "InProgress" &&
      r.currentStage !== "Done",
  ).length;
  const completed = rows.filter((r) => r.status === "Completed").length;
  const endingSoon = rows.filter(
    (r) =>
      r.status !== "Completed" &&
      r.daysUntilLastDay !== null &&
      r.daysUntilLastDay >= 0 &&
      r.daysUntilLastDay <= 30,
  ).length;
  return { totalActive, pendingAction, completed, endingSoon };
}

/** Returns null if the case doesn't exist. */
export async function getOffboardingCaseById(
  id: number,
): Promise<OffboardingCaseDetail | null> {
  if (!Number.isFinite(id) || id <= 0) return null;

  const r = await prisma.offboarding_case.findUnique({
    where: { id },
    include: {
      user: {
        include: {
          user_profile: { select: { full_name: true } },
          employment: {
            where: { status: { in: ["active", "onboarding"] } },
            orderBy: { start_date: "desc" },
            take: 1,
            include: {
              branch: { select: { branch_code: true, branch_name: true } },
              department: { select: { department_name: true } },
            },
          },
        },
      },
      supervisor: {
        include: { user_profile: { select: { full_name: true } } },
      },
      assigned_hr: {
        include: { user_profile: { select: { full_name: true } } },
      },
      created_by: {
        include: { user_profile: { select: { full_name: true } } },
      },
      finance_processed_by: {
        include: { user_profile: { select: { full_name: true } } },
      },
      checklist_items: { orderBy: { id: "asc" } },
      audit_log: {
        include: {
          actor: { include: { user_profile: { select: { full_name: true } } } },
        },
        orderBy: { created_at: "desc" },
      },
    },
  });
  if (!r) return null;

  const employment = r.user.employment[0];
  return {
    id: r.id,
    caseType: r.case_type as OffboardingCaseType,
    status: r.status as OffboardingStatus,
    currentStage: r.current_stage as OffboardingStage,
    user: {
      id: r.user_id,
      name: r.user.user_profile?.full_name ?? r.user.email,
      email: r.user.email,
      departmentName: employment?.department?.department_name ?? null,
      branchCode: employment?.branch?.branch_code ?? null,
      branchName: employment?.branch?.branch_name ?? null,
      position: employment?.position ?? null,
    },
    assignedHr: r.assigned_hr
      ? {
          id: r.assigned_hr.user_id,
          name: r.assigned_hr.user_profile?.full_name ?? r.assigned_hr.email,
          email: r.assigned_hr.email,
        }
      : null,
    lastWorkingDay: r.last_working_day
      ? r.last_working_day.toISOString().slice(0, 10)
      : null,
    exitInterviewDate: r.exit_interview_date
      ? r.exit_interview_date.toISOString().slice(0, 10)
      : null,
    exitInterviewTime: r.exit_interview_time,
    exitInterviewLocation: r.exit_interview_location,
    exitInterviewCompletedAt: r.exit_interview_completed_at?.toISOString() ?? null,
    exitInterviewNotes: r.exit_interview_notes,
    exitInterviewOutcome: r.exit_interview_outcome,
    supervisorDecision: r.supervisor_decision,
    supervisorDecisionAt: r.supervisor_decision_at?.toISOString() ?? null,
    resignationLetterFileId: r.resignation_letter_file_id,
    resignedAt: r.resigned_at?.toISOString() ?? null,
    supervisor: r.supervisor
      ? {
          id: r.supervisor.user_id,
          name: r.supervisor.user_profile?.full_name ?? r.supervisor.email,
          email: r.supervisor.email,
        }
      : null,
    supervisorSignoffStatus: r.supervisor_signoff_status,
    supervisorSignoffAt: r.supervisor_signoff_at?.toISOString() ?? null,
    supervisorRemarks: r.supervisor_remarks,
    financeRemarks: r.finance_remarks,
    finalPayBreakdown: r.final_pay_breakdown,
    financeProcessedAt: r.finance_processed_at?.toISOString() ?? null,
    financeProcessedByName: r.finance_processed_by
      ? r.finance_processed_by.user_profile?.full_name ?? r.finance_processed_by.email
      : null,
    createdByName:
      r.created_by.user_profile?.full_name ?? r.created_by.email,
    createdAt: r.created_at.toISOString(),
    completedAt: r.completed_at?.toISOString() ?? null,
    checklist: r.checklist_items.map((c) => ({
      id: c.id,
      itemKey: c.item_key,
      title: c.title,
      actorRole: c.actor_role,
      status: c.status,
      completedAt: c.completed_at?.toISOString() ?? null,
      completedByName: null, // Phase 4 will populate when actions are wired
      notes: c.notes,
      linkedClaimId: c.linked_claim_id,
    })),
    auditLog: r.audit_log.map((a) => ({
      id: a.id,
      actorName: a.actor
        ? a.actor.user_profile?.full_name ?? a.actor.email
        : null,
      action: a.action,
      stage: a.stage,
      details: a.details,
      createdAt: a.created_at.toISOString(),
    })),
  };
}
