"use server";
import { auth } from "@/auth";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export interface SaveResult {
  ok: boolean;
  error?: string;
}

interface DaySlot {
  start: string;
  end: string;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
type DayKey = (typeof DAYS)[number];

const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/;

function sanitize(input: unknown): Record<DayKey, DaySlot | null> | null {
  if (!input || typeof input !== "object") return null;
  const out = {} as Record<DayKey, DaySlot | null>;
  for (const day of DAYS) {
    const v = (input as Record<string, unknown>)[day];
    if (v === null || v === undefined) {
      out[day] = null;
      continue;
    }
    if (typeof v !== "object") return null;
    const slot = v as Record<string, unknown>;
    const start = typeof slot.start === "string" ? slot.start.trim() : "";
    const end = typeof slot.end === "string" ? slot.end.trim() : "";
    if (!start && !end) { out[day] = null; continue; }
    if (!TIME_RE.test(start) || !TIME_RE.test(end)) return null;
    if (start >= end) return null;
    out[day] = { start, end };
  }
  return out;
}

export async function saveWorkingHours(
  employmentId: number,
  schedule: unknown,
): Promise<SaveResult> {
  const session = await auth();
  if (!session?.user?.email) return { ok: false, error: "Not authenticated." };

  const role = (session.user as { role?: string }).role ?? "";
  const position = (session.user as { position?: string | null }).position ?? "";
  if (role !== "superadmin" && position !== "FT HOD") {
    return { ok: false, error: "Not authorized to edit working hours." };
  }

  if (!Number.isInteger(employmentId) || employmentId <= 0) {
    return { ok: false, error: "Invalid employment id." };
  }

  const sanitized = sanitize(schedule);
  if (!sanitized) {
    return { ok: false, error: "Invalid schedule. Use HH:MM format and ensure end > start." };
  }

  try {
    const target = await prisma.employment.findUnique({
      where: { employment_id: employmentId },
      select: { employment_id: true, department_id: true },
    });
    if (!target) return { ok: false, error: "Employment record not found." };

    if (role !== "superadmin" && position === "FT HOD") {
      const me = await prisma.users.findUnique({
        where: { email: session.user.email },
        select: {
          employment: {
            where: { status: "active" },
            take: 1,
            select: { department_id: true },
          },
        },
      });
      const myDept = me?.employment[0]?.department_id ?? null;
      if (myDept === null || target.department_id !== myDept) {
        return { ok: false, error: "You can only edit staff in your department." };
      }
    }

    await prisma.employment.update({
      where: { employment_id: employmentId },
      data: { working_hours: sanitized as object },
    });

    revalidatePath("/staff-directory");
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to save." };
  }
}
