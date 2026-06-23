import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  getVersionsForStaff,
  getResolvedSchedulesForDate,
  upsertScheduleVersion,
  type WeeklySchedule,
  DAY_KEYS,
} from "@/lib/schedule-history";

export const dynamic = "force-dynamic";

const EDIT_ROLES = new Set(["superadmin", "ceo", "hr"]);

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.email) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthenticated" }, { status: 401 }) };
  }
  const me = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { role: { select: { role_type: true } } },
  });
  return { ok: true as const, roleType: me?.role?.role_type?.toLowerCase() ?? "" };
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const branchStaffIdParam = url.searchParams.get("branchStaffId");
  const dateParam = url.searchParams.get("date");

  if (branchStaffIdParam) {
    const id = Number(branchStaffIdParam);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid branchStaffId" }, { status: 400 });
    }
    const versions = await getVersionsForStaff(id);
    return NextResponse.json({ versions });
  }

  if (dateParam) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    const schedules = await getResolvedSchedulesForDate(dateParam);
    return NextResponse.json({ schedules });
  }

  return NextResponse.json(
    { error: "Provide ?branchStaffId=N or ?date=YYYY-MM-DD" },
    { status: 400 },
  );
}

function isWeeklySchedule(value: unknown): value is WeeklySchedule {
  if (!value || typeof value !== "object") return false;
  for (const [k, v] of Object.entries(value)) {
    if (!DAY_KEYS.includes(k as (typeof DAY_KEYS)[number])) return false;
    if (v === null) continue;
    if (typeof v !== "object") return false;
    const day = v as { start?: unknown; end?: unknown };
    if (typeof day.start !== "string" || typeof day.end !== "string") return false;
    if (!/^\d{2}:\d{2}$/.test(day.start) || !/^\d{2}:\d{2}$/.test(day.end)) return false;
  }
  return true;
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  if (!EDIT_ROLES.has(auth.roleType)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { branchStaffId, effectiveFrom, schedule } = (body ?? {}) as {
    branchStaffId?: unknown;
    effectiveFrom?: unknown;
    schedule?: unknown;
  };
  if (typeof branchStaffId !== "number" || !Number.isInteger(branchStaffId)) {
    return NextResponse.json({ error: "branchStaffId must be an integer" }, { status: 400 });
  }
  if (typeof effectiveFrom !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom)) {
    return NextResponse.json({ error: "effectiveFrom must be YYYY-MM-DD" }, { status: 400 });
  }
  if (!isWeeklySchedule(schedule)) {
    return NextResponse.json(
      { error: "schedule must be { Sun..Sat: { start: 'HH:MM', end: 'HH:MM' } | null }" },
      { status: 400 },
    );
  }

  await upsertScheduleVersion({ branchStaffId, effectiveFrom, schedule });
  return NextResponse.json({ ok: true });
}
