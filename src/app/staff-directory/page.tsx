import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AppShell from "@/app/components/AppShell";
import StaffDirectory, {
  type DirectoryPerson,
  type DirectoryBranch,
  type DirectoryDepartment,
} from "./StaffDirectory";

export const dynamic = "force-dynamic";

export default async function StaffDirectoryPage() {
  const session = await auth();
  if (!session) redirect("/login");

  // Auto-inactivate employments whose end_date has already passed.
  // Idempotent — only flips rows still marked "active" with an expired end_date.
  await prisma.employment.updateMany({
    where: {
      status: "active",
      end_date: { not: null, lt: new Date() },
    },
    data: { status: "inactive" },
  });

  const [employments, branchRows, deptRows] = await Promise.all([
    // Pull both active and inactive employments — chart/card filter to active client-side,
    // timeline view needs inactive employments to render "Left {year}" events.
    prisma.employment.findMany({
      // role_id 6 = staff (the bulk of employees); 2 = ceo, 4 = branch.
      where: {
        users: { role_id: { in: [2, 4, 6] } },
      },
      select: {
        employment_id: true,
        employee_id: true,
        position: true,
        start_date: true,
        end_date: true,
        status: true,
        working_hours: true,
        branch: {
          select: { branch_id: true, branch_name: true, branch_code: true, location: true },
        },
        department: {
          select: { department_id: true, department_name: true, department_code: true },
        },
        users: {
          select: {
            user_id: true,
            email: true,
            user_profile: { select: { full_name: true, phone: true } },
          },
        },
      },
    }),
    prisma.branch.findMany({
      orderBy: { branch_name: "asc" },
      select: { branch_id: true, branch_name: true, branch_code: true, location: true },
    }),
    prisma.department.findMany({
      orderBy: { department_name: "asc" },
      select: { department_id: true, department_name: true, department_code: true },
    }),
  ]);

  const people: DirectoryPerson[] = employments
    .filter(e => e.users && e.position)
    .map(e => ({
      id: e.employment_id,
      userId: e.users.user_id,
      employeeId: e.employee_id ?? null,
      name: e.users.user_profile?.full_name?.trim() || e.users.email.split("@")[0],
      email: e.users.email,
      phone: e.users.user_profile?.phone ?? null,
      position: (e.position ?? "").trim(),
      branchId: e.branch?.branch_id ?? null,
      branchName: e.branch?.branch_name ?? null,
      branchCode: e.branch?.branch_code ?? null,
      branchLocation: e.branch?.location ?? null,
      departmentId: e.department?.department_id ?? null,
      departmentName: e.department?.department_name ?? null,
      departmentCode: e.department?.department_code ?? null,
      joinedYear: e.start_date ? new Date(e.start_date).getFullYear() : null,
      startDate: e.start_date ? e.start_date.toISOString().slice(0, 10) : null,
      endDate: e.end_date ? e.end_date.toISOString().slice(0, 10) : null,
      isActive: e.status === "active",
      workingHoursRaw: (e.working_hours as unknown) ?? null,
    }));

  const branches: DirectoryBranch[] = branchRows.map(b => ({
    id: b.branch_id,
    name: b.branch_name,
    code: b.branch_code ?? null,
    location: b.location ?? null,
  }));

  const departments: DirectoryDepartment[] = deptRows.map(d => ({
    id: d.department_id,
    name: d.department_name,
    code: d.department_code ?? null,
  }));

  const userEmail = session.user?.email ?? "";
  const userRole = (session.user as { role?: string } | undefined)?.role ?? "";
  const userName = session.user?.name ?? null;

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <StaffDirectory people={people} branches={branches} departments={departments} />
    </AppShell>
  );
}
