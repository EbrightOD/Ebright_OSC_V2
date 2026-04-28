"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { prisma } from "@/lib/prisma";
import { canReviewClaims } from "@/app/claim/roles";
import { uploadToDrive } from "@/lib/drive";
import path from "node:path";

type ClaimType = "sales" | "health" | "transport";

const TRANSPORT_RATE = 0.7;
const TRANSPORT_ROUND_TRIP = 2;
const HEALTH_ANNUAL_CAP = 500;

const ALLOWED_EXTS = new Set([".pdf", ".jpg", ".jpeg", ".png"]);
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB

const MONTH_FOLDER_NAMES = [
  "01 JAN", "02 FEB", "03 MAR", "04 APR", "05 MAY", "06 JUN",
  "07 JUL", "08 AUG", "09 SEP", "10 OCT", "11 NOV", "12 DEC",
];

function driveFolderForClaim(claimDate: Date): string[] {
  return [String(claimDate.getFullYear()), MONTH_FOLDER_NAMES[claimDate.getMonth()]];
}

export interface SubmitClaimResult {
  ok: boolean;
  error?: string;
  claimId?: number;
  amount?: number;
}

export interface ReviewClaimResult {
  ok: boolean;
  error?: string;
}

function s(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

async function saveAttachment(
  file: File,
  claimType: ClaimType,
  claimDate: Date,
): Promise<string> {
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTS.has(ext)) {
    throw new Error("Attachment must be PDF, JPG, or PNG.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Attachment exceeds 5MB.");
  }
  const { id } = await uploadToDrive(file, {
    prefix: claimType,
    folderPath: driveFolderForClaim(claimDate),
  });
  return id;
}

export async function submitClaim(
  _prev: SubmitClaimResult | null,
  formData: FormData,
): Promise<SubmitClaimResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { ok: false, error: "Not authenticated." };

  const user = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { user_id: true },
  });
  if (!user) return { ok: false, error: "User record not found." };

  const claimType = s(formData, "claim_type") as ClaimType;
  if (!["sales", "health", "transport"].includes(claimType)) {
    return { ok: false, error: "Invalid claim type." };
  }

  const dateStr = s(formData, "claim_date");
  if (!dateStr) return { ok: false, error: "Claim date is required." };
  const claimDate = new Date(dateStr);
  if (Number.isNaN(claimDate.getTime())) {
    return { ok: false, error: "Claim date is invalid." };
  }

  const now = new Date();
  const earliestAllowed = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const latestAllowed = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  if (claimDate < earliestAllowed || claimDate > latestAllowed) {
    return { ok: false, error: "Claim date must be within the current or previous month." };
  }

  let amount: number;
  if (claimType === "transport") {
    const distance = parseFloat(s(formData, "distance"));
    if (!distance || distance <= 0) {
      return { ok: false, error: "Distance is required." };
    }
    amount = +(distance * TRANSPORT_RATE * TRANSPORT_ROUND_TRIP).toFixed(2);
  } else {
    const parsed = parseFloat(s(formData, "amount"));
    if (!parsed || parsed <= 0) {
      return { ok: false, error: "Amount is required." };
    }
    amount = +parsed.toFixed(2);
  }

  if (claimType === "health") {
    const year = claimDate.getFullYear();
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);
    const used = await prisma.claim.aggregate({
      where: {
        user_id: user.user_id,
        claim_type: "health",
        status: { in: ["approved", "disbursed", "received"] },
        claim_date: { gte: yearStart, lte: yearEnd },
      },
      _sum: { approved_amount: true },
    });
    const usedAmount = Number(used._sum.approved_amount ?? 0);
    if (usedAmount + amount > HEALTH_ANNUAL_CAP) {
      const remaining = Math.max(0, HEALTH_ANNUAL_CAP - usedAmount);
      return {
        ok: false,
        error: `Exceeds annual health cap. Remaining this year: RM ${remaining.toFixed(2)}.`,
      };
    }
  }

  const description = s(formData, "description") || null;

  let attachmentId: string | null = null;
  const fileField = formData.get("attachment_file");
  if (fileField instanceof File && fileField.size > 0) {
    try {
      attachmentId = await saveAttachment(fileField, claimType, claimDate);
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Attachment upload failed." };
    }
  }

  const created = await prisma.claim.create({
    data: {
      claim_type: claimType,
      claim_description: description,
      amount,
      claim_date: claimDate,
      status: "pending",
      attachment: attachmentId,
      user_id: user.user_id,
    },
    select: { claim_id: true, amount: true },
  });

  revalidatePath("/claim");

  return {
    ok: true,
    claimId: created.claim_id,
    amount: Number(created.amount),
  };
}

export async function reviewClaim(
  _prev: ReviewClaimResult | null,
  formData: FormData,
): Promise<ReviewClaimResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { ok: false, error: "Not authenticated." };

  const reviewer = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: {
      user_id: true,
      role_id: true,
      email: true,
      role: { select: { role_type: true } },
    },
  });
  if (
    !reviewer ||
    !canReviewClaims({
      role_id: reviewer.role_id,
      email: reviewer.email,
      role_type: reviewer.role?.role_type ?? null,
    })
  ) {
    return { ok: false, error: "Only finance or superadmin can review claims." };
  }

  const claimId = parseInt(s(formData, "claim_id"), 10);
  if (Number.isNaN(claimId)) return { ok: false, error: "Invalid claim id." };

  const action = s(formData, "action"); // "approve" | "reject"
  if (!["approve", "reject"].includes(action)) {
    return { ok: false, error: "Invalid action." };
  }

  const remarksRaw = s(formData, "remarks");
  if (action === "reject" && remarksRaw.length === 0) {
    return { ok: false, error: "Remarks are required when rejecting a claim." };
  }
  const remarks = remarksRaw || null;

  const existing = await prisma.claim.findUnique({
    where: { claim_id: claimId },
    select: { amount: true, status: true },
  });
  if (!existing) return { ok: false, error: "Claim not found." };

  let approvedAmount: number | null = null;
  if (action === "approve") {
    const parsed = parseFloat(s(formData, "approved_amount"));
    approvedAmount = !Number.isNaN(parsed) && parsed > 0
      ? +parsed.toFixed(2)
      : Number(existing.amount);
  }

  await prisma.claim.update({
    where: { claim_id: claimId },
    data: {
      status: action === "approve" ? "approved" : "rejected",
      approved_amount: approvedAmount,
      remarks,
      updated_at: new Date(),
    },
  });

  revalidatePath("/claim");
  revalidatePath(`/claim/${claimId}`);

  return { ok: true };
}
