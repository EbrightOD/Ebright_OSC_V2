import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { queryEbrightHrfs } from "@/lib/ebright-hrfs";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = new Set(["superadmin", "ceo", "hr"]);

// Copies HRFS BranchStaff.workingHours + BranchStaffSchedule rows into the
// LOCAL DB so the Summary/Report can stop reading from HRFS for schedule data.
//
// Matching key: employment.employee_id == BranchStaff.employeeId.
// - Updates employment.working_hours_json to the current BranchStaff snapshot.
// - For each BranchStaffSchedule row, upserts an employment_schedule_version
//   row keyed on (employment_id, effective_from).
//
// Idempotent — safe to re-run. Returns a summary report.
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

  // 1) Pull current snapshot from HRFS — every active staff that has an
  //    employeeId AND a workingHours JSON.
  const bs = await queryEbrightHrfs<{
    id: number;
    employee_id: string | null;
    name: string | null;
    working_hours: unknown;
  }>(
    `SELECT id, "employeeId" AS employee_id, name, "workingHours" AS working_hours
       FROM public."BranchStaff"
      WHERE status = 'Active' AND "employeeId" IS NOT NULL AND "workingHours" IS NOT NULL`,
  );

  // 2) Pull every versioned row that exists on HRFS, if the table is there.
  //    Table may not exist on every env, so wrap in try/catch.
  type HrfsVersion = {
    branch_staff_id: number;
    effective_from: string;
    schedule: unknown;
  };
  let hrfsVersions: HrfsVersion[] = [];
  try {
    const res = await queryEbrightHrfs<HrfsVersion>(
      `SELECT "branchStaffId" AS branch_staff_id,
              to_char("effectiveFrom", 'YYYY-MM-DD') AS effective_from,
              schedule
         FROM public."BranchStaffSchedule"`,
    );
    hrfsVersions = res.rows;
  } catch (e) {
    // Table doesn't exist or some other error — just proceed without versions.
    void e;
  }

  // 3) Map BranchStaff.id → employee_id for joining the version rows below.
  const branchStaffIdToEmployeeId = new Map<number, string>();
  for (const row of bs.rows) {
    if (row.employee_id) branchStaffIdToEmployeeId.set(row.id, row.employee_id);
  }

  // 4) Pull local active employment rows keyed by employee_id.
  const localEmps = await prisma.employment.findMany({
    where: {
      status: "active",
      employee_id: { not: null, in: [...new Set(bs.rows.map((b) => b.employee_id).filter((x): x is string => !!x))] },
    },
    select: { employment_id: true, employee_id: true },
  });
  const empByCode = new Map<string, number>();
  for (const e of localEmps) {
    if (e.employee_id) empByCode.set(e.employee_id, e.employment_id);
  }

  // 5) Update employment.working_hours_json for matches.
  let updatedCurrent = 0;
  const unmatchedStaff: string[] = [];
  for (const row of bs.rows) {
    if (!row.employee_id) continue;
    const empId = empByCode.get(row.employee_id);
    if (!empId) {
      unmatchedStaff.push(`${row.name ?? "?"} (${row.employee_id})`);
      continue;
    }
    await prisma.employment.update({
      where: { employment_id: empId },
      data: { working_hours_json: row.working_hours as never },
    });
    updatedCurrent += 1;
  }

  // 6) Upsert versioned rows where we can map them via employee_id.
  let upsertedVersions = 0;
  const unmappedVersions: number[] = [];
  for (const v of hrfsVersions) {
    const code = branchStaffIdToEmployeeId.get(v.branch_staff_id);
    if (!code) {
      unmappedVersions.push(v.branch_staff_id);
      continue;
    }
    const empId = empByCode.get(code);
    if (!empId) {
      unmappedVersions.push(v.branch_staff_id);
      continue;
    }
    await prisma.employment_schedule_version.upsert({
      where: {
        employment_id_effective_from: {
          employment_id: empId,
          effective_from: new Date(v.effective_from + "T00:00:00Z"),
        },
      },
      create: {
        employment_id: empId,
        effective_from: new Date(v.effective_from + "T00:00:00Z"),
        schedule: v.schedule as never,
      },
      update: { schedule: v.schedule as never },
    });
    upsertedVersions += 1;
  }

  return NextResponse.json({
    ok: true,
    branchStaffWithSchedule: bs.rows.length,
    updatedCurrent,
    upsertedVersions,
    unmatchedStaff: unmatchedStaff.slice(0, 25),
    unmatchedStaffCount: unmatchedStaff.length,
    unmappedVersionCount: unmappedVersions.length,
  });
}

export async function GET() {
  return POST();
}
