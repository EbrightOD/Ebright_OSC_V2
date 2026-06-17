// Pure decision logic for HOD leave approvals. No Prisma, no session, no I/O.

/** A HOD is identified by their active employment position (not by role_type). */
export const HOD_POSITION = "FT HOD";

// Two-stage approval:
//   pending --HOD approve--> hod_approved --HR approve--> approved
// HOD is identified by position (FT HOD) + department; HR by email, company-wide.
export const HOD_APPROVED_STATUS = "hod_approved";

export type LeaveActionStage = "hod" | "hr";

export interface LeaveActionContext {
  /** the actor's active employment position (e.g. "FT HOD") */
  actorPosition: string | null | undefined;
  /** the actor's email (used to identify HR) */
  actorEmail: string | null | undefined;
  /** the actor's own active department id; null if unknown */
  actorDepartmentId: number | null;
  /** current status of the leave request */
  requestStatus: string;
  /** the requester's active department id; null if they have no active employment */
  requesterDepartmentId: number | null;
}

export type StageResult = { ok: true; stage: LeaveActionStage } | { ok: false; error: string };

/** Decides whether the actor may act on the request and, if so, at which stage. */
export function resolveLeaveAction(ctx: LeaveActionContext): StageResult {
  const email = (ctx.actorEmail ?? "").toLowerCase();

  // HR finalizes HOD-approved requests, company-wide.
  if (email === HR_OVERVIEW_EMAIL) {
    if (ctx.requestStatus !== HOD_APPROVED_STATUS) {
      return { ok: false, error: "This request is not awaiting HR approval." };
    }
    return { ok: true, stage: "hr" };
  }

  // HOD acts on pending requests from their own department.
  if (ctx.actorPosition === HOD_POSITION) {
    if (ctx.requestStatus !== "pending") {
      return { ok: false, error: "This request is no longer awaiting HOD approval." };
    }
    if (ctx.actorDepartmentId == null) {
      return { ok: false, error: "Your account has no department assigned." };
    }
    if (ctx.requesterDepartmentId == null) {
      return { ok: false, error: "This request's owner has no department assigned." };
    }
    if (ctx.requesterDepartmentId !== ctx.actorDepartmentId) {
      return { ok: false, error: "This request belongs to another department." };
    }
    return { ok: true, stage: "hod" };
  }

  return { ok: false, error: "You are not authorized to action leave requests." };
}

/** Status a request moves to when approved at the given stage. */
export function nextStatusForApproval(stage: LeaveActionStage): "hod_approved" | "approved" {
  return stage === "hod" ? HOD_APPROVED_STATUS : "approved";
}

export type ReasonResult = { ok: true; reason: string } | { ok: false; error: string };

/** Rejection requires a non-empty written reason. */
export function validateRejectionReason(reason: string): ReasonResult {
  const trimmed = (reason ?? "").trim();
  if (!trimmed) return { ok: false, error: "A reason is required to reject a request." };
  return { ok: true, reason: trimmed };
}

// --- Leave records (read-only oversight) access ---------------------------------

/** HR oversight account: sees every leave request company-wide. */
export const HR_OVERVIEW_EMAIL = "hr@ebright.my";
/** Superadmin account: scoped to the Optimisation department (it has no employment row). */
export const SUPERADMIN_EMAIL = "od@ebright.my";
/** Department the superadmin account is mapped to (resolved by name at runtime). */
export const OPTIMISATION_DEPARTMENT_NAME = "Optimisation";

export type LeaveRecordsAccess =
  | { kind: "all" } // company-wide
  | { kind: "optimisation" } // od@ebright.my -> Optimisation department
  | { kind: "own-department" } // department-role users -> their own department
  | { kind: "none" }; // no access

/**
 * Decides which leave records a viewer may see. Email checks come before the role
 * check because hr@ebright.my is itself a "department"-role user (it must get "all",
 * not its own department), and od@ebright.my (superadmin) has no employment to derive
 * a department from.
 */
export function resolveLeaveRecordsAccess(input: {
  role: string | null | undefined;
  email: string | null | undefined;
}): LeaveRecordsAccess {
  const email = (input.email ?? "").toLowerCase();
  if (email === HR_OVERVIEW_EMAIL) return { kind: "all" };
  if (email === SUPERADMIN_EMAIL) return { kind: "optimisation" };
  if (input.role === "department") return { kind: "own-department" };
  return { kind: "none" };
}
