// Pure decision logic for HOD leave approvals. No Prisma, no session, no I/O.

export interface HodActionContext {
  /** session.user.role of the actor */
  actorRole: string | null | undefined;
  /** the HOD's own active department id; null if unknown */
  actorDepartmentId: number | null;
  /** current status of the leave request */
  requestStatus: string;
  /** the requester's active department id; null if they have no active employment */
  requesterDepartmentId: number | null;
}

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Whether this actor (a HOD) may approve/reject this request. */
export function resolveHodAction(ctx: HodActionContext): ActionResult {
  if (ctx.actorRole !== "hod") {
    return { ok: false, error: "You are not authorized to action leave requests." };
  }
  if (ctx.requestStatus !== "pending") {
    return { ok: false, error: "This request is no longer awaiting approval." };
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
  return { ok: true };
}

export type ReasonResult = { ok: true; reason: string } | { ok: false; error: string };

/** Rejection requires a non-empty written reason. */
export function validateRejectionReason(reason: string): ReasonResult {
  const trimmed = (reason ?? "").trim();
  if (!trimmed) return { ok: false, error: "A reason is required to reject a request." };
  return { ok: true, reason: trimmed };
}
