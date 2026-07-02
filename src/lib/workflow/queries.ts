import "server-only";
import { prisma } from "@/lib/prisma";
import type { WorkflowActor } from "@/lib/workflow/permissions";
import {
  canViewWorkflowForDepartment,
  scopedDepartmentId,
} from "@/lib/workflow/permissions";

// ============================================================
// Workflow Center — server-side queries.
// All callers MUST pass a WorkflowActor so scoping happens at the
// query level (not just on the frontend). HODs see only their dept.
// ============================================================

export type WorkflowStatus = "draft" | "active" | "archived";
export type WorkflowCategory = "Onboarding" | "Offboarding" | "Other" | string;

export interface WorkflowListRow {
  id: number;
  name: string;
  departmentId: number;
  departmentName: string;
  category: string;
  appliesTo: string[];
  status: WorkflowStatus;
  trigger: string;
  stepCount: number;
  assignedCount: number;
}

export interface WorkflowStepDetail {
  id: number;
  stepNumber: number;
  title: string;
  description: string | null;
  actorRole: string;
  type: string;
  dueDaysAfterStart: number;
  required: boolean;
}

export interface WorkflowDetail {
  id: number;
  name: string;
  departmentId: number;
  departmentName: string;
  category: string;
  appliesTo: string[];
  status: WorkflowStatus;
  trigger: string;
  steps: WorkflowStepDetail[];
  assignedCount: number;
  createdByName: string;
  createdAt: string;
  publishedAt: string | null;
  archivedAt: string | null;
}

export interface DepartmentTab {
  id: number;
  name: string;
  code: string;
}

/** Departments the actor can see tabs for (HOD sees only their own). */
export async function listVisibleDepartments(
  actor: WorkflowActor,
): Promise<DepartmentTab[]> {
  const scope = scopedDepartmentId(actor);
  const rows = await prisma.department.findMany({
    where: scope === null ? undefined : { department_id: scope },
    orderBy: { department_name: "asc" },
    select: { department_id: true, department_name: true, department_code: true },
  });
  return rows.map((d) => ({
    id: d.department_id,
    name: d.department_name,
    code: d.department_code,
  }));
}

/**
 * List workflows the actor is allowed to see.
 * - superadmin / admin / od → all
 * - hr → all, but only active ones (read-only)
 * - hod → own department only
 */
export async function listWorkflowsForActor(
  actor: WorkflowActor,
): Promise<WorkflowListRow[]> {
  const scope = scopedDepartmentId(actor);
  const isHrReadOnly = actor.roleType === "hr";

  const rows = await prisma.workflow_template.findMany({
    where: {
      ...(scope === null ? {} : { department_id: scope }),
      ...(isHrReadOnly ? { status: "active" } : {}),
    },
    include: {
      department: { select: { department_name: true } },
      _count: { select: { steps: true, assignments: true } },
    },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });

  return rows.map((w) => ({
    id: w.id,
    name: w.name,
    departmentId: w.department_id,
    departmentName: w.department.department_name,
    category: w.category,
    appliesTo: parseAppliesTo(w.applies_to),
    status: w.status as WorkflowStatus,
    trigger: w.trigger,
    stepCount: w._count.steps,
    assignedCount: w._count.assignments,
  }));
}

/** Returns null if the workflow doesn't exist OR the actor can't see it. */
export async function getWorkflowDetailForActor(
  id: number,
  actor: WorkflowActor,
): Promise<WorkflowDetail | null> {
  if (!Number.isFinite(id) || id <= 0) return null;

  const w = await prisma.workflow_template.findUnique({
    where: { id },
    include: {
      department: { select: { department_name: true } },
      created_by: {
        include: { user_profile: { select: { full_name: true } } },
      },
      steps: { orderBy: { step_number: "asc" } },
      _count: { select: { assignments: true } },
    },
  });
  if (!w) return null;

  // Permission gate (server-side enforcement)
  if (!canViewWorkflowForDepartment(actor, w.department_id)) return null;
  if (actor.roleType === "hr" && w.status !== "active") return null;

  return {
    id: w.id,
    name: w.name,
    departmentId: w.department_id,
    departmentName: w.department.department_name,
    category: w.category,
    appliesTo: parseAppliesTo(w.applies_to),
    status: w.status as WorkflowStatus,
    trigger: w.trigger,
    steps: w.steps.map((s) => ({
      id: s.id,
      stepNumber: s.step_number,
      title: s.title,
      description: s.description,
      actorRole: s.actor_role,
      type: s.type,
      dueDaysAfterStart: s.due_days_after_start,
      required: s.required,
    })),
    assignedCount: w._count.assignments,
    createdByName:
      w.created_by.user_profile?.full_name ?? w.created_by.email,
    createdAt: w.created_at.toISOString(),
    publishedAt: w.published_at?.toISOString() ?? null,
    archivedAt: w.archived_at?.toISOString() ?? null,
  };
}

/**
 * Distinct categories used by workflows in the actor's accessible scope.
 * Drives the "categories that have been used before" entries in the
 * Create modal's category dropdown.
 */
export async function listKnownCategories(
  actor: WorkflowActor,
): Promise<string[]> {
  const scope = scopedDepartmentId(actor);
  const rows = await prisma.workflow_template.findMany({
    where: scope === null ? undefined : { department_id: scope },
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });
  return rows.map((r) => r.category).filter(Boolean);
}

// ============================================================
// Assignment queries — for the candidate view + HR/HOD progress
// ============================================================

export interface AssignmentStepRow {
  id: number;
  stepId: number;
  stepNumber: number;
  title: string;
  description: string | null;
  actorRole: string;
  type: string;
  status: "Pending" | "Done";
  completedAt: string | null;
  completedByName: string | null;
}

export interface AssignmentForCandidate {
  id: number;
  workflowId: number;
  workflowName: string;
  workflowCategory: string;
  departmentName: string;
  status: string;
  assignedAt: string;
  steps: AssignmentStepRow[];
}

/** Get the candidate's currently-active workflow assignment (if any). */
export async function getActiveAssignmentForUser(
  userId: number,
): Promise<AssignmentForCandidate | null> {
  if (!Number.isFinite(userId) || userId <= 0) return null;

  const a = await prisma.workflow_assignment.findFirst({
    where: { user_id: userId, status: { not: "Cancelled" } },
    orderBy: { assigned_at: "desc" },
    include: {
      workflow_template: {
        include: {
          department: { select: { department_name: true } },
        },
      },
      assignment_steps: {
        include: {
          workflow_step: true,
          completed_by: {
            include: { user_profile: { select: { full_name: true } } },
          },
        },
      },
    },
  });
  if (!a) return null;

  const stepRows = a.assignment_steps
    .map((as) => ({
      id: as.id,
      stepId: as.workflow_step_id,
      stepNumber: as.workflow_step.step_number,
      title: as.workflow_step.title,
      description: as.workflow_step.description,
      actorRole: as.workflow_step.actor_role,
      type: as.workflow_step.type,
      status: as.status as "Pending" | "Done",
      completedAt: as.completed_at?.toISOString() ?? null,
      completedByName: as.completed_by
        ? as.completed_by.user_profile?.full_name ?? as.completed_by.email
        : null,
    }))
    .sort((x, y) => x.stepNumber - y.stepNumber);

  return {
    id: a.id,
    workflowId: a.workflow_template_id,
    workflowName: a.workflow_template.name,
    workflowCategory: a.workflow_template.category,
    departmentName: a.workflow_template.department.department_name,
    status: a.status,
    assignedAt: a.assigned_at.toISOString(),
    steps: stepRows,
  };
}

/**
 * For the "Assign Workflow" dropdown shown to HR/HOD on the candidate
 * detail page. Returns active workflows whose department matches the
 * candidate's department AND category is Onboarding (per spec — the
 * dept workflow that fires after Day 3).
 */
export async function listAssignableOnboardingWorkflowsForUser(
  userId: number,
): Promise<Array<{ id: number; name: string; category: string }>> {
  const candidateEmployment = await prisma.employment.findFirst({
    where: { user_id: userId, status: { in: ["active", "onboarding"] } },
    orderBy: { start_date: "desc" },
    select: { department_id: true },
  });
  if (!candidateEmployment?.department_id) return [];

  const rows = await prisma.workflow_template.findMany({
    where: {
      department_id: candidateEmployment.department_id,
      status: "active",
      category: "Onboarding",
    },
    select: { id: true, name: true, category: true },
    orderBy: { name: "asc" },
  });
  return rows;
}

// ============================================================
// Helpers
// ============================================================

function parseAppliesTo(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((v): v is string => typeof v === "string");
  return [];
}
