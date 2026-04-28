"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { prisma } from "@/lib/prisma";
import { uploadToDrive } from "@/lib/drive";
import path from "node:path";

const ALLOWED_EXTS = new Set([".pdf", ".jpg", ".jpeg", ".png"]);
const MAX_FILE_BYTES = 5 * 1024 * 1024;

export interface SubmitLeaveResult {
  ok: boolean;
  error?: string;
  leaveId?: number;
  totalDays?: number;
}

function s(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

async function saveAttachment(file: File): Promise<string> {
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTS.has(ext)) {
    throw new Error("Attachment must be PDF, JPG, or PNG.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Attachment exceeds 5MB.");
  }
  const { id } = await uploadToDrive(file, { prefix: "leave" });
  return id;
}

function daysInclusive(start: Date, end: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const diff = Math.round((end.getTime() - start.getTime()) / msPerDay);
  return diff + 1;
}

export async function submitLeaveRequest(
  _prev: SubmitLeaveResult | null,
  formData: FormData,
): Promise<SubmitLeaveResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { ok: false, error: "Not authenticated." };

  const user = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { user_id: true },
  });
  if (!user) return { ok: false, error: "User record not found." };

  const leaveTypeId = parseInt(s(formData, "leave_type_id"), 10);
  if (Number.isNaN(leaveTypeId)) {
    return { ok: false, error: "Leave type is required." };
  }
  const leaveType = await prisma.leave_types.findUnique({
    where: { leave_type_id: leaveTypeId },
    select: { leave_type_id: true },
  });
  if (!leaveType) return { ok: false, error: "Invalid leave type." };

  const startStr = s(formData, "start_date");
  const endStr = s(formData, "end_date");
  if (!startStr || !endStr) {
    return { ok: false, error: "Both start and end dates are required." };
  }
  const startDate = new Date(startStr);
  const endDate = new Date(endStr);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return { ok: false, error: "Invalid date value." };
  }
  if (endDate < startDate) {
    return { ok: false, error: "End date cannot be before start date." };
  }

  const totalDays = daysInclusive(startDate, endDate);

  const reason = s(formData, "reason") || null;

  let attachmentId: string | null = null;
  const fileField = formData.get("attachment_file");
  if (fileField instanceof File && fileField.size > 0) {
    try {
      attachmentId = await saveAttachment(fileField);
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Attachment upload failed." };
    }
  }

  const created = await prisma.leave_request.create({
    data: {
      user_id: user.user_id,
      leave_type_id: leaveTypeId,
      start_date: startDate,
      end_date: endDate,
      total_days: totalDays,
      reason,
      attachment: attachmentId,
      status: "pending",
    },
    select: { leave_id: true, total_days: true },
  });

  revalidatePath("/attendance/leave");

  return {
    ok: true,
    leaveId: created.leave_id,
    totalDays: Number(created.total_days),
  };
}
