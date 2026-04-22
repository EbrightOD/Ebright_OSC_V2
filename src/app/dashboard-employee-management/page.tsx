import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import AppShell from "@/app/components/AppShell";
import EmployeeListView from "@/app/components/EmployeeListView";
import { listEmployees, listBranches, listDepartments } from "@/lib/employeeQueries";

export const dynamic = "force-dynamic";

export default async function EmployeeManagementPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [employees, branches, departments] = await Promise.all([
    listEmployees(),
    listBranches(),
    listDepartments(),
  ]);

  const userEmail = session.user?.email ?? "";
  const userRole = (session.user as { role?: string } | undefined)?.role ?? "";
  const userName = session.user?.name ?? null;

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <EmployeeListView employees={employees} branches={branches} departments={departments} />
    </AppShell>
  );
}
