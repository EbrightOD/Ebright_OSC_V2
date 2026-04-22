"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { prisma } from "@/lib/prisma";

export interface ApprovalResult {
  ok: boolean;
  error?: string;
}

async function requireSuperadmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "superadmin") {
    return { ok: false, error: "Only superadmin can approve or reject registrations." } as const;
  }
  return { ok: true } as const;
}

export async function approveUser(userId: number): Promise<ApprovalResult> {
  const gate = await requireSuperadmin();
  if (!gate.ok) return gate;
  if (!Number.isFinite(userId) || userId <= 0) return { ok: false, error: "Invalid user id." };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.users.update({
        where: { user_id: userId },
        data: { status: "active" },
      });
      await tx.employment.updateMany({
        where: { user_id: userId, status: "pending" },
        data: { status: "active" },
      });
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown database error.";
    return { ok: false, error: `Could not approve: ${msg}` };
  }

  revalidatePath("/approvals");
  revalidatePath("/dashboard-employee-management");
  return { ok: true };
}

export async function rejectUser(userId: number): Promise<ApprovalResult> {
  const gate = await requireSuperadmin();
  if (!gate.ok) return gate;
  if (!Number.isFinite(userId) || userId <= 0) return { ok: false, error: "Invalid user id." };

  try {
    await prisma.users.delete({ where: { user_id: userId } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown database error.";
    return { ok: false, error: `Could not reject: ${msg}` };
  }

  revalidatePath("/approvals");
  return { ok: true };
}
