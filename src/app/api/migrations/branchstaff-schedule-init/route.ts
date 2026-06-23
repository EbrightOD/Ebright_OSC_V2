import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { queryEbrightHrfs } from "@/lib/ebright-hrfs";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = new Set(["superadmin", "ceo", "hr"]);

// One-shot bootstrap for BranchStaffSchedule (versioned weekly hours).
// Idempotent — IF NOT EXISTS everywhere. Visit /api/migrations/branchstaff-schedule-init.
//
// IMPORTANT: tables are created in the `public` schema explicitly so the ORM
// (Prisma + raw pg) which connects with schema=public will see them. If the
// raw connection's default search_path ever puts unqualified names into a
// different schema, the unqualified CREATE would land out of reach.
export async function POST() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const me = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { role: { select: { role_type: true } } },
  });
  const roleType = me?.role?.role_type?.toLowerCase() ?? "";
  if (!ALLOWED_ROLES.has(roleType)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await queryEbrightHrfs(
    `CREATE TABLE IF NOT EXISTS public."BranchStaffSchedule" (
       id              serial PRIMARY KEY,
       "branchStaffId" integer NOT NULL REFERENCES public."BranchStaff"(id) ON DELETE CASCADE,
       "effectiveFrom" date    NOT NULL,
       schedule        jsonb   NOT NULL,
       "createdAt"     timestamptz NOT NULL DEFAULT now(),
       UNIQUE ("branchStaffId", "effectiveFrom")
     )`,
  );
  await queryEbrightHrfs(
    `CREATE INDEX IF NOT EXISTS branchstaff_schedule_lookup_idx
       ON public."BranchStaffSchedule" ("branchStaffId", "effectiveFrom" DESC)`,
  );

  const count = await queryEbrightHrfs<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM public."BranchStaffSchedule"`,
  );

  return NextResponse.json({
    ok: true,
    rows: Number(count.rows[0]?.count ?? 0),
  });
}

// GET mirror so it can be triggered from the browser address bar after auth.
export async function GET() {
  return POST();
}
