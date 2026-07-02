"use server";
import { auth } from "@/auth";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getApproverDepartmentId } from "./queries";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

type Decision = "approved" | "rejected" | "pending";

async function authorize(): Promise<
  | { ok: true; userId: number; role: string; position: string; deptId: number | null }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.email) return { ok: false, error: "Not authenticated." };

  const role = (session.user as { role?: string }).role ?? "";
  const position = (session.user as { position?: string | null }).position ?? "";
  if (role !== "superadmin" && position !== "FT HOD") {
    return { ok: false, error: "Not authorized to approve leave." };
  }

  const me = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { user_id: true },
  });
  if (!me) return { ok: false, error: "User record not found." };

  const deptId = role === "superadmin" ? null : await getApproverDepartmentId(me.user_id);
  return { ok: true, userId: me.user_id, role, position, deptId };
}

async function loadRequest(leaveId: number) {
  return prisma.leave_request.findUnique({
    where: { leave_id: leaveId },
    select: {
      leave_id: true,
      user_id: true,
      users_leave_request_user_idTousers: {
        select: {
          employment: {
            where: { status: "active" },
            take: 1,
            select: { department_id: true },
          },
        },
      },
    },
  });
}

async function ensureScope(
  leaveId: number,
  auth: { userId: number; role: string; deptId: number | null },
): Promise<ActionResult & { ok: boolean }> {
  const req = await loadRequest(leaveId);
  if (!req) return { ok: false, error: "Leave request not found." };
  if (req.user_id === auth.userId) {
    return { ok: false, error: "You cannot review your own leave request." };
  }
  if (auth.role === "superadmin") return { ok: true };
  const reqDept = req.users_leave_request_user_idTousers.employment[0]?.department_id ?? null;
  if (reqDept === null || reqDept !== auth.deptId) {
    return { ok: false, error: "This request is outside your department." };
  }
  return { ok: true };
}

async function setDecision(leaveId: number, decision: Decision): Promise<ActionResult> {
  const auth = await authorize();
  if (!auth.ok) return auth;

  const scope = await ensureScope(leaveId, auth);
  if (!scope.ok) return scope;

  await prisma.leave_request.update({
    where: { leave_id: leaveId },
    data: {
      status: decision,
      approved_by: decision === "pending" ? null : auth.userId,
      approved_at: decision === "pending" ? null : new Date(),
    },
  });

  revalidatePath("/attendance/leave");
  return { ok: true };
}

export async function approveLeave(leaveId: number): Promise<ActionResult> {
  return setDecision(leaveId, "approved");
}

export async function rejectLeave(leaveId: number): Promise<ActionResult> {
  return setDecision(leaveId, "rejected");
}

export async function undoLeaveDecision(leaveId: number): Promise<ActionResult> {
  return setDecision(leaveId, "pending");
}

export async function saveLeaveRemarks(leaveId: number, remarks: string): Promise<ActionResult> {
  const auth = await authorize();
  if (!auth.ok) return auth;

  const scope = await ensureScope(leaveId, auth);
  if (!scope.ok) return scope;

  await prisma.leave_request.update({
    where: { leave_id: leaveId },
    data: { remarks: remarks.trim() || null },
  });

  revalidatePath("/attendance/leave");
  return { ok: true };
}
