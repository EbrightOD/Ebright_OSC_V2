import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { prisma } from "@/lib/prisma";

// The page treats a schedule as identified by `${branchName}_${startDate}` and
// uses ISO date strings on the wire. Internally v2 stores branch_id (FK to
// branch) and DATE columns, so we translate at the boundary.

interface ScheduleWire {
  id: string;
  branch: string;
  startDate: string;
  endDate: string;
  selections: unknown;
  notes: unknown;
  originalSelections: unknown;
  originalNotes: unknown;
  status?: string;
  originalAuthor?: string;
}

function parseBody(raw: unknown):
  | { ok: true; data: ScheduleWire }
  | { ok: false; error: string } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "Invalid JSON body" };
  }
  const b = raw as Record<string, unknown>;
  const reqString = (k: string) =>
    typeof b[k] === "string" && (b[k] as string).length > 0;
  for (const k of ["id", "branch", "startDate", "endDate"]) {
    if (!reqString(k)) return { ok: false, error: `${k} is required` };
  }
  return {
    ok: true,
    data: {
      id: b.id as string,
      branch: b.branch as string,
      startDate: b.startDate as string,
      endDate: b.endDate as string,
      selections: b.selections,
      notes: b.notes,
      originalSelections: b.originalSelections,
      originalNotes: b.originalNotes,
      status:
        typeof b.status === "string" ? (b.status as string) : undefined,
      originalAuthor:
        typeof b.originalAuthor === "string"
          ? (b.originalAuthor as string)
          : undefined,
    },
  };
}

// GET /api/schedules — return every schedule, newest first, in the shape the
// page expects: { branch (full name), startDate, endDate, selections, notes, … }.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json(
      { success: false, error: "Unauthorised" },
      { status: 401 },
    );
  }

  try {
    const rows = await prisma.manpower_schedule.findMany({
      orderBy: { start_date: "desc" },
      include: { branch: { select: { branch_name: true } } },
    });
    const schedules = rows.map((r) => ({
      id: `${r.branch.branch_name}_${r.start_date.toISOString().slice(0, 10)}`,
      branch: r.branch.branch_name,
      startDate: r.start_date.toISOString().slice(0, 10),
      endDate: r.end_date.toISOString().slice(0, 10),
      selections: r.selections,
      notes: r.notes,
      originalSelections: r.original_selections,
      originalNotes: r.original_notes,
      status: r.status,
      submittedAt: r.submitted_at.toISOString(),
    }));
    return NextResponse.json({ success: true, schedules });
  } catch (err) {
    console.error("[GET /api/schedules]", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch schedules" },
      { status: 500 },
    );
  }
}

// POST /api/schedules — upsert by (branch_id, start_date).
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json(
      { success: false, error: "Unauthorised" },
      { status: 401 },
    );
  }

  try {
    const parsed = parseBody(await req.json());
    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: 400 },
      );
    }
    const body = parsed.data;

    const me = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { user_id: true },
    });
    if (!me) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const branch = await prisma.branch.findFirst({
      where: { branch_name: body.branch },
      select: { branch_id: true, branch_name: true },
    });
    if (!branch) {
      return NextResponse.json(
        { success: false, error: `Unknown branch: ${body.branch}` },
        { status: 400 },
      );
    }

    const startDate = new Date(`${body.startDate}T00:00:00Z`);
    const endDate = new Date(`${body.endDate}T00:00:00Z`);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid startDate/endDate" },
        { status: 400 },
      );
    }

    const selections = (body.selections ?? {}) as object;
    const notes = (body.notes ?? {}) as object;
    const originalSelections = (body.originalSelections ?? selections) as object;
    const originalNotes = (body.originalNotes ?? notes) as object;
    const status = body.status ?? "Finalized";

    const saved = await prisma.manpower_schedule.upsert({
      where: {
        branch_id_start_date: {
          branch_id: branch.branch_id,
          start_date: startDate,
        },
      },
      update: {
        selections,
        notes,
        status,
      },
      create: {
        branch_id: branch.branch_id,
        user_id: me.user_id,
        start_date: startDate,
        end_date: endDate,
        selections,
        notes,
        original_selections: originalSelections,
        original_notes: originalNotes,
        status,
      },
      include: { branch: { select: { branch_name: true } } },
    });

    return NextResponse.json({
      success: true,
      schedule: {
        id: `${saved.branch.branch_name}_${saved.start_date.toISOString().slice(0, 10)}`,
        branch: saved.branch.branch_name,
        startDate: saved.start_date.toISOString().slice(0, 10),
        endDate: saved.end_date.toISOString().slice(0, 10),
        selections: saved.selections,
        notes: saved.notes,
        originalSelections: saved.original_selections,
        originalNotes: saved.original_notes,
        status: saved.status,
        submittedAt: saved.submitted_at.toISOString(),
      },
    });
  } catch (err) {
    console.error("[POST /api/schedules]", err);
    return NextResponse.json(
      { success: false, error: "Failed to save schedule" },
      { status: 500 },
    );
  }
}
