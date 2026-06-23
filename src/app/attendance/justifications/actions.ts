"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Fixed reason categories. Adding new ones is safe; renaming requires a data
// migration since the column stores the string verbatim.
export const JUSTIFICATION_REASONS = [
  { value: "approved_mc",    label: "Approved MC" },
  { value: "sick_no_mc",     label: "Sick — no MC" },
  { value: "personal",       label: "Personal" },
  { value: "overseas",       label: "Overseas / travel" },
  { value: "onsite_visit",   label: "On-site visit" },
  { value: "forgot_to_scan", label: "Forgot to scan" },
  { value: "scanner_issue",  label: "Scanner not working" },
  { value: "approved_late",  label: "Approved late / off" },
  { value: "other",          label: "Other" },
] as const;

export type JustificationReason = (typeof JUSTIFICATION_REASONS)[number]["value"];

const ALLOWED_ROLES = new Set(["superadmin", "ceo", "hr"]);

const REASON_VALUES = new Set(JUSTIFICATION_REASONS.map((r) => r.value));

export type JustificationResult =
  | { ok: true; id: number }
  | { ok: false; error: string };

async function requireHr() {
  const session = await auth();
  if (!session?.user?.email) return { ok: false as const, error: "Unauthenticated" };
  const me = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { user_id: true, role: { select: { role_type: true } } },
  });
  if (!me) return { ok: false as const, error: "User not found" };
  const roleType = me.role?.role_type?.toLowerCase() ?? "";
  if (!ALLOWED_ROLES.has(roleType)) return { ok: false as const, error: "Forbidden" };
  return { ok: true as const, userId: me.user_id };
}

export async function saveJustification(
  formData: FormData,
): Promise<JustificationResult> {
  const hr = await requireHr();
  if (!hr.ok) return { ok: false, error: hr.error };

  const userId = Number(formData.get("user_id"));
  const dateStr = String(formData.get("date") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const note = (formData.get("note") ?? "").toString().trim() || null;

  if (!Number.isInteger(userId) || userId <= 0) {
    return { ok: false, error: "Invalid user_id" };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { ok: false, error: "Invalid date (YYYY-MM-DD)" };
  }
  if (!REASON_VALUES.has(reason as JustificationReason)) {
    return { ok: false, error: "Invalid reason category" };
  }

  const dateValue = new Date(dateStr + "T00:00:00Z");

  const row = await prisma.attendance_justification.upsert({
    where: { user_id_date: { user_id: userId, date: dateValue } },
    create: {
      user_id: userId,
      date: dateValue,
      reason_category: reason,
      note,
      justified_by: hr.userId,
    },
    update: {
      reason_category: reason,
      note,
      justified_by: hr.userId,
      updated_at: new Date(),
    },
    select: { id: true },
  });

  revalidatePath("/attendance/summary");
  revalidatePath("/attendance/report");
  return { ok: true, id: row.id };
}

export async function deleteJustification(
  formData: FormData,
): Promise<JustificationResult> {
  const hr = await requireHr();
  if (!hr.ok) return { ok: false, error: hr.error };

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, error: "Invalid id" };
  }

  await prisma.attendance_justification.delete({ where: { id } });

  revalidatePath("/attendance/summary");
  revalidatePath("/attendance/report");
  return { ok: true, id };
}
