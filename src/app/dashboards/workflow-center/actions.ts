"use server";
import { auth } from "@/auth";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  loadWorkflowActor,
  canCreateWorkflow,
  canEditWorkflowForDepartment,
  canAssignWorkflow,
  canDeleteWorkflow,
} from "@/lib/workflow/permissions";

// Transaction client type — derived from the prisma singleton.
// (Same pattern we used elsewhere to avoid the IDE Prisma resolution
// quirk with the namespace import.)
type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

// ============================================================
// Workflow Center — server actions
// All actions:
//   1. Re-load the current actor (cookie + DB lookup)
//   2. Check permission BEFORE any write
//   3. Run the write inside a transaction where multiple inserts apply
//   4. revalidatePath the affected routes
// ============================================================

export interface ActionResult {
  ok: boolean;
  error?: string;
  workflowId?: number;
}

async function currentActor() {
  const session = await auth();
  if (!session?.user?.email) return null;
  return await loadWorkflowActor(session.user.email);
}

function s(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function parseAppliesTo(formData: FormData): string[] {
  // Multi-value: form posts the same field multiple times (one per
  // checked option). Falls back to a single CSV value if the form
  // uses one input with comma-separated values.
  const all = formData.getAll("applies_to");
  if (all.length > 1) {
    return all.filter((v): v is string => typeof v === "string");
  }
  if (all.length === 1 && typeof all[0] === "string") {
    return all[0]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

// ─── Create workflow ──────────────────────────────────────────────
export async function createWorkflow(
  _: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const actor = await currentActor();
  if (!actor) return { ok: false, error: "Not signed in." };
  if (!canCreateWorkflow(actor)) {
    return { ok: false, error: "You don't have permission to create workflows." };
  }

  const name = s(formData, "name");
  if (!name) return { ok: false, error: "Name is required." };

  // Department — HODs MUST use their own department; we enforce this
  // server-side regardless of what the form sent.
  let departmentId: number;
  if (actor.roleType === "hod") {
    if (!actor.departmentId) {
      return {
        ok: false,
        error: "You don't have an active department on your employment.",
      };
    }
    departmentId = actor.departmentId;
  } else {
    const raw = s(formData, "department_id");
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return { ok: false, error: "Department is required." };
    }
    departmentId = parsed;
  }

  const category = s(formData, "category");
  if (!category) {
    return { ok: false, error: "Category is required." };
  }

  const trigger = s(formData, "trigger") || "after-day-3";
  const appliesTo = parseAppliesTo(formData);
  const initialStatus = s(formData, "publish") === "1" ? "active" : "draft";
  const publishedAt = initialStatus === "active" ? new Date() : null;

  try {
    const created = await prisma.workflow_template.create({
      data: {
        name,
        department_id: departmentId,
        category,
        status: initialStatus,
        trigger,
        applies_to: appliesTo,
        created_by_id: actor.userId,
        published_at: publishedAt,
      },
      select: { id: true },
    });

    revalidatePath("/dashboards/workflow-center");
    return { ok: true, workflowId: created.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: `Could not create workflow: ${msg}` };
  }
}

// ─── Update workflow (name, category, trigger, applies_to) ────────
export async function updateWorkflow(
  workflowId: number,
  formData: FormData,
): Promise<ActionResult> {
  const actor = await currentActor();
  if (!actor) return { ok: false, error: "Not signed in." };
  if (!Number.isFinite(workflowId) || workflowId <= 0) {
    return { ok: false, error: "Invalid workflow id." };
  }
  const existing = await prisma.workflow_template.findUnique({
    where: { id: workflowId },
    select: { id: true, department_id: true },
  });
  if (!existing) return { ok: false, error: "Workflow not found." };
  if (!canEditWorkflowForDepartment(actor, existing.department_id)) {
    return { ok: false, error: "You can't edit this workflow." };
  }

  const name = s(formData, "name");
  const category = s(formData, "category");
  const trigger = s(formData, "trigger");
  const appliesTo = parseAppliesTo(formData);

  try {
    await prisma.workflow_template.update({
      where: { id: workflowId },
      data: {
        ...(name ? { name } : {}),
        ...(category ? { category } : {}),
        ...(trigger ? { trigger } : {}),
        ...(appliesTo.length > 0 ? { applies_to: appliesTo } : {}),
      },
    });

    revalidatePath("/dashboards/workflow-center");
    revalidatePath(`/dashboards/workflow-center/${workflowId}`);
    return { ok: true, workflowId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: `Could not update workflow: ${msg}` };
  }
}

// ─── Publish (draft → active) ─────────────────────────────────────
export async function publishWorkflow(workflowId: number): Promise<ActionResult> {
  const actor = await currentActor();
  if (!actor) return { ok: false, error: "Not signed in." };
  const existing = await prisma.workflow_template.findUnique({
    where: { id: workflowId },
    select: { id: true, department_id: true, status: true },
  });
  if (!existing) return { ok: false, error: "Workflow not found." };
  if (!canEditWorkflowForDepartment(actor, existing.department_id)) {
    return { ok: false, error: "You can't publish this workflow." };
  }
  if (existing.status === "archived") {
    return { ok: false, error: "Cannot publish an archived workflow." };
  }

  await prisma.workflow_template.update({
    where: { id: workflowId },
    data: { status: "active", published_at: new Date(), archived_at: null },
  });

  revalidatePath("/dashboards/workflow-center");
  revalidatePath(`/dashboards/workflow-center/${workflowId}`);
  return { ok: true, workflowId };
}

// ─── Archive (any → archived) ─────────────────────────────────────
export async function archiveWorkflow(workflowId: number): Promise<ActionResult> {
  const actor = await currentActor();
  if (!actor) return { ok: false, error: "Not signed in." };
  const existing = await prisma.workflow_template.findUnique({
    where: { id: workflowId },
    select: { id: true, department_id: true },
  });
  if (!existing) return { ok: false, error: "Workflow not found." };
  if (!canEditWorkflowForDepartment(actor, existing.department_id)) {
    return { ok: false, error: "You can't archive this workflow." };
  }
  await prisma.workflow_template.update({
    where: { id: workflowId },
    data: { status: "archived", archived_at: new Date() },
  });
  revalidatePath("/dashboards/workflow-center");
  revalidatePath(`/dashboards/workflow-center/${workflowId}`);
  return { ok: true, workflowId };
}

// ─── Delete workflow (hard delete) ────────────────────────────────
// Superadmin / admin only. Blocks deletion while candidates are still
// assigned (archive instead) so no in-flight progress is destroyed.
export async function deleteWorkflow(workflowId: number): Promise<ActionResult> {
  const actor = await currentActor();
  if (!actor) return { ok: false, error: "Not signed in." };
  if (!canDeleteWorkflow(actor)) {
    return { ok: false, error: "You don't have permission to delete workflows." };
  }

  const existing = await prisma.workflow_template.findUnique({
    where: { id: workflowId },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "Workflow not found." };

  // Block when candidates are still assigned — archive is the safe path.
  const assignedCount = await prisma.workflow_assignment.count({
    where: { workflow_template_id: workflowId },
  });
  if (assignedCount > 0) {
    return {
      ok: false,
      error: `Cannot delete: ${assignedCount} candidate${
        assignedCount === 1 ? " is" : "s are"
      } still assigned. Archive the workflow instead.`,
    };
  }

  try {
    // No assignments exist here (blocked above), so only steps + the
    // template need removing — children first to satisfy FK constraints.
    await prisma.$transaction(async (tx: TxClient) => {
      await tx.workflow_step.deleteMany({
        where: { workflow_template_id: workflowId },
      });
      await tx.workflow_template.delete({ where: { id: workflowId } });
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: `Could not delete workflow: ${msg}` };
  }

  revalidatePath("/dashboards/workflow-center");
  return { ok: true, workflowId };
}

// ─── Add step ─────────────────────────────────────────────────────
export async function addWorkflowStep(
  workflowId: number,
  formData: FormData,
): Promise<ActionResult> {
  const actor = await currentActor();
  if (!actor) return { ok: false, error: "Not signed in." };
  const existing = await prisma.workflow_template.findUnique({
    where: { id: workflowId },
    select: { id: true, department_id: true },
  });
  if (!existing) return { ok: false, error: "Workflow not found." };
  if (!canEditWorkflowForDepartment(actor, existing.department_id)) {
    return { ok: false, error: "You can't add steps to this workflow." };
  }

  const title = s(formData, "title");
  if (!title) return { ok: false, error: "Step title is required." };
  const actorRole = s(formData, "actor_role") || "Candidate";
  const type = s(formData, "type") || "Task";
  const description = s(formData, "description") || null;
  const dueDays = Number.parseInt(s(formData, "due_days_after_start") || "0", 10);
  const required = formData.get("required") !== "off";

  // Next step_number = (max + 1)
  const max = await prisma.workflow_step.aggregate({
    where: { workflow_template_id: workflowId },
    _max: { step_number: true },
  });
  const nextNumber = (max._max.step_number ?? 0) + 1;

  await prisma.workflow_step.create({
    data: {
      workflow_template_id: workflowId,
      step_number: nextNumber,
      title,
      description,
      actor_role: actorRole,
      type,
      due_days_after_start: Number.isFinite(dueDays) ? dueDays : 0,
      required,
    },
  });

  revalidatePath(`/dashboards/workflow-center/${workflowId}`);
  return { ok: true, workflowId };
}

// ─── Delete step ──────────────────────────────────────────────────
export async function deleteWorkflowStep(stepId: number): Promise<ActionResult> {
  const actor = await currentActor();
  if (!actor) return { ok: false, error: "Not signed in." };
  const step = await prisma.workflow_step.findUnique({
    where: { id: stepId },
    include: { workflow_template: { select: { id: true, department_id: true } } },
  });
  if (!step) return { ok: false, error: "Step not found." };
  if (!canEditWorkflowForDepartment(actor, step.workflow_template.department_id)) {
    return { ok: false, error: "You can't delete steps from this workflow." };
  }

  await prisma.$transaction(async (tx: TxClient) => {
    await tx.workflow_step.delete({ where: { id: stepId } });
    // Renumber remaining steps so they stay contiguous.
    const remaining = await tx.workflow_step.findMany({
      where: { workflow_template_id: step.workflow_template.id },
      orderBy: { step_number: "asc" },
      select: { id: true },
    });
    for (let i = 0; i < remaining.length; i++) {
      await tx.workflow_step.update({
        where: { id: remaining[i].id },
        data: { step_number: i + 1 },
      });
    }
  });

  revalidatePath(`/dashboards/workflow-center/${step.workflow_template.id}`);
  return { ok: true, workflowId: step.workflow_template.id };
}

// ─── Assign workflow to a candidate (manual) ──────────────────────
export async function assignWorkflowToCandidate(
  workflowId: number,
  candidateUserId: number,
): Promise<ActionResult> {
  const actor = await currentActor();
  if (!actor) return { ok: false, error: "Not signed in." };
  if (!canAssignWorkflow(actor)) {
    return { ok: false, error: "You don't have permission to assign workflows." };
  }
  const workflow = await prisma.workflow_template.findUnique({
    where: { id: workflowId },
    select: { id: true, department_id: true, status: true },
  });
  if (!workflow) return { ok: false, error: "Workflow not found." };
  if (workflow.status !== "active") {
    return { ok: false, error: "Only active workflows can be assigned." };
  }
  // HOD can only assign workflows from their own department.
  if (
    actor.roleType === "hod" &&
    actor.departmentId !== workflow.department_id
  ) {
    return { ok: false, error: "You can't assign other departments' workflows." };
  }

  // No duplicate active assignment per (user, workflow).
  const existing = await prisma.workflow_assignment.findUnique({
    where: {
      user_id_workflow_template_id: {
        user_id: candidateUserId,
        workflow_template_id: workflowId,
      },
    },
    select: { id: true, status: true },
  });
  if (existing && existing.status !== "Cancelled") {
    return { ok: false, error: "This candidate is already on this workflow." };
  }

  try {
    await prisma.$transaction(async (tx: TxClient) => {
      // Re-use a cancelled row if present, else insert new.
      const assignment = existing
        ? await tx.workflow_assignment.update({
            where: { id: existing.id },
            data: {
              status: "InProgress",
              assigned_at: new Date(),
              assigned_by_id: actor.userId,
              completed_at: null,
            },
            select: { id: true },
          })
        : await tx.workflow_assignment.create({
            data: {
              workflow_template_id: workflowId,
              user_id: candidateUserId,
              assigned_by_id: actor.userId,
            },
            select: { id: true },
          });

      // Seed one assignment_step per workflow_step
      const steps = await tx.workflow_step.findMany({
        where: { workflow_template_id: workflowId },
        select: { id: true },
        orderBy: { step_number: "asc" },
      });
      if (steps.length > 0) {
        await tx.workflow_assignment_step.createMany({
          data: steps.map((s) => ({
            workflow_assignment_id: assignment.id,
            workflow_step_id: s.id,
          })),
          skipDuplicates: true,
        });
      }
    });

    revalidatePath(`/induction/onboarding-dashboard`);
    revalidatePath(`/induction/onboarding-dashboard/${candidateUserId}`);
    return { ok: true, workflowId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: `Could not assign workflow: ${msg}` };
  }
}

// ─── Mark an assignment step done (candidate-facing) ──────────────
export async function markAssignmentStepDone(
  assignmentStepId: number,
): Promise<ActionResult> {
  const actor = await currentActor();
  if (!actor) return { ok: false, error: "Not signed in." };

  const as = await prisma.workflow_assignment_step.findUnique({
    where: { id: assignmentStepId },
    include: {
      workflow_assignment: { select: { id: true, user_id: true } },
      workflow_step: { select: { actor_role: true } },
    },
  });
  if (!as) return { ok: false, error: "Step not found." };

  const isOwner = as.workflow_assignment.user_id === actor.userId;
  const isHrLike =
    actor.roleType === "superadmin" ||
    actor.roleType === "admin" ||
    actor.roleType === "hr" ||
    actor.roleType === "od" ||
    actor.roleType === "hod";

  // Candidate-actor steps: only the candidate (or HR-like) can tick.
  // HR/HOD-actor steps: only HR-like roles can tick.
  if (as.workflow_step.actor_role === "Candidate") {
    if (!isOwner && !isHrLike) {
      return { ok: false, error: "Only the candidate can tick this task." };
    }
  } else {
    if (!isHrLike) {
      return { ok: false, error: "Only HR / HOD can tick this task." };
    }
  }

  if (as.status === "Done") {
    return { ok: true }; // idempotent
  }

  await prisma.workflow_assignment_step.update({
    where: { id: assignmentStepId },
    data: {
      status: "Done",
      completed_at: new Date(),
      completed_by_id: actor.userId,
    },
  });

  // If every step is now done → mark the assignment completed.
  const remaining = await prisma.workflow_assignment_step.count({
    where: {
      workflow_assignment_id: as.workflow_assignment.id,
      status: { not: "Done" },
    },
  });
  if (remaining === 0) {
    await prisma.workflow_assignment.update({
      where: { id: as.workflow_assignment.id },
      data: { status: "Completed", completed_at: new Date() },
    });
  }

  revalidatePath(`/induction`);
  return { ok: true };
}
