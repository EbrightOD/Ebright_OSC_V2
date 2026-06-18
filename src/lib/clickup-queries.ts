import { prisma } from "@/lib/prisma";

export interface DepartmentMember {
  name: string;
  email: string;
}

/** Active employees in a department, with display name (falls back to email). */
export async function getDepartmentMembers(departmentId: number): Promise<DepartmentMember[]> {
  const rows = await prisma.users.findMany({
    where: {
      status: "active",
      employment: { some: { status: "active", department_id: departmentId } },
    },
    select: {
      email: true,
      user_profile: { select: { full_name: true } },
    },
  });
  return rows.map((r) => ({
    name: r.user_profile?.full_name ?? r.email,
    email: r.email,
  }));
}

/** Department name for display. */
export async function getDepartmentName(departmentId: number): Promise<string> {
  const dept = await prisma.department.findUnique({
    where: { department_id: departmentId },
    select: { department_name: true },
  });
  return dept?.department_name ?? "Department";
}
