import { prisma } from "@/lib/prisma";
import type { RosterEntry } from "@/lib/clickup";

/**
 * All active employees, with the fields needed to match an extracted ClickUp
 * owner nickname (full_name / nick_name) and to scope by department.
 */
export async function getEmployeeRoster(): Promise<RosterEntry[]> {
  const rows = await prisma.users.findMany({
    where: { status: "active" },
    select: {
      user_id: true,
      user_profile: { select: { full_name: true, nick_name: true } },
      employment: {
        where: { status: "active" },
        take: 1,
        select: { department_id: true },
      },
    },
  });
  return rows.map((r) => ({
    userId: r.user_id,
    fullName: r.user_profile?.full_name ?? "",
    nickName: r.user_profile?.nick_name ?? null,
    departmentId: r.employment[0]?.department_id ?? null,
  }));
}

/** All branches (name + code), for branch-mention matching. */
export async function getBranches(): Promise<{ name: string; code: string | null }[]> {
  const rows = await prisma.branch.findMany({
    select: { branch_name: true, branch_code: true },
    orderBy: { branch_name: "asc" },
  });
  return rows.map((r) => ({ name: r.branch_name, code: r.branch_code }));
}

/** All departments (id + name), for company-wide grouping. */
export async function getDepartments(): Promise<{ id: number; name: string }[]> {
  const rows = await prisma.department.findMany({
    select: { department_id: true, department_name: true },
    orderBy: { department_name: "asc" },
  });
  return rows.map((r) => ({ id: r.department_id, name: r.department_name }));
}

/** Department name for display. */
export async function getDepartmentName(departmentId: number): Promise<string> {
  const dept = await prisma.department.findUnique({
    where: { department_id: departmentId },
    select: { department_name: true },
  });
  return dept?.department_name ?? "Department";
}
