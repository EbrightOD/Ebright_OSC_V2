import "server-only";
import { prisma } from "@/lib/prisma";

// ============================================================
// Workflow Center — server-side permission helpers.
//
// Enforces who can see / create / edit / publish workflows. Used at
// the route + action level. The frontend uses the same helpers via
// server-side props so the UI matches enforcement, but the source of
// truth is server-side — a HOD hitting another department's workflow
// URL gets a 404 even if their UI hid the tab.
//
// Role rules (per spec):
//   - superadmin / admin → all departments, full CRUD
//   - hr                 → all departments, read-only on active workflows
//   - hod                → own department only, full CRUD
//   - od                 → all departments, read-only (treated like hr)
//   - everyone else      → no access
// ============================================================

export type WorkflowActorRole =
  | "superadmin"
  | "admin"
  | "hr"
  | "od"
  | "hod"
  | "other";

export interface WorkflowActor {
  userId: number;
  roleType: WorkflowActorRole;
  /** HOD's department_id (from active employment). null if not a HOD. */
  departmentId: number | null;
}

const ALL_DEPARTMENT_ROLES = new Set<WorkflowActorRole>([
  "superadmin",
  "admin",
  "hr",
  "od",
]);
const EDIT_ROLES = new Set<WorkflowActorRole>(["superadmin", "hod"]);
const CREATE_ROLES = new Set<WorkflowActorRole>(["superadmin", "hod"]);
const DELETE_ROLES = new Set<WorkflowActorRole>(["superadmin", "admin"]);

/** Build the actor record for the currently-signed-in user. */
export async function loadWorkflowActor(
  userEmail: string,
): Promise<WorkflowActor | null> {
  const u = await prisma.users.findUnique({
    where: { email: userEmail },
    select: {
      user_id: true,
      role: { select: { role_type: true } },
      employment: {
        where: { status: "active" },
        orderBy: { start_date: "desc" },
        take: 1,
        select: { department_id: true },
      },
    },
  });
  if (!u) return null;
  const raw = (u.role?.role_type ?? "").toLowerCase();
  const allowedRoles: WorkflowActorRole[] = [
    "superadmin",
    "admin",
    "hr",
    "od",
    "hod",
  ];
  const role: WorkflowActorRole = allowedRoles.includes(raw as WorkflowActorRole)
    ? (raw as WorkflowActorRole)
    : "other";
  return {
    userId: u.user_id,
    roleType: role,
    departmentId: u.employment[0]?.department_id ?? null,
  };
}

/** Anyone with HRMS access (the role gate on the page itself). */
export function canAccessWorkflowCenter(actor: WorkflowActor): boolean {
  return actor.roleType !== "other";
}

/** Can this actor create new workflows? */
export function canCreateWorkflow(actor: WorkflowActor): boolean {
  return CREATE_ROLES.has(actor.roleType);
}

/** Can this actor hard-delete a workflow? Superadmin / admin only. */
export function canDeleteWorkflow(actor: WorkflowActor): boolean {
  return DELETE_ROLES.has(actor.roleType);
}

/** Returns true if the actor can see ALL departments, false if scoped. */
export function canSeeAllDepartments(actor: WorkflowActor): boolean {
  return ALL_DEPARTMENT_ROLES.has(actor.roleType);
}

/** The single department this actor is scoped to, or null = no scope. */
export function scopedDepartmentId(actor: WorkflowActor): number | null {
  if (canSeeAllDepartments(actor)) return null;
  if (actor.roleType === "hod") return actor.departmentId;
  return null; // "other" — shouldn't be hitting these queries anyway
}

/** Can this actor edit a workflow belonging to the given department? */
export function canEditWorkflowForDepartment(
  actor: WorkflowActor,
  workflowDepartmentId: number,
): boolean {
  if (!EDIT_ROLES.has(actor.roleType)) return false;
  if (actor.roleType === "superadmin") return true;
  // hod
  return actor.departmentId !== null && actor.departmentId === workflowDepartmentId;
}

/** Can this actor view a workflow belonging to the given department? */
export function canViewWorkflowForDepartment(
  actor: WorkflowActor,
  workflowDepartmentId: number,
): boolean {
  if (canSeeAllDepartments(actor)) return true;
  if (actor.roleType === "hod") {
    return actor.departmentId !== null && actor.departmentId === workflowDepartmentId;
  }
  return false;
}

/** Can this actor assign workflows to candidates? */
export function canAssignWorkflow(actor: WorkflowActor): boolean {
  // HR + HOD + superadmin can manually assign. HR can assign anything;
  // HOD only their own dept (enforced when picking the workflow).
  return (
    actor.roleType === "superadmin" ||
    actor.roleType === "hr" ||
    actor.roleType === "hod"
  );
}
