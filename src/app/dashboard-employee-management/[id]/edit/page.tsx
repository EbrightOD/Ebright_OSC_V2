import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { ArrowLeft } from "lucide-react";
import { authOptions } from "@/lib/nextauth";
import AppShell from "@/app/components/AppShell";
import EmployeeForm from "@/app/components/EmployeeForm";
import { getEmployeeById, listBranches, listDepartments } from "@/lib/employeeQueries";
import { updateEmployee } from "@/app/dashboard-employee-management/actions";

export const dynamic = "force-dynamic";

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;
  const numId = parseInt(id, 10);
  const [employee, branches, departments] = await Promise.all([
    Number.isNaN(numId) ? Promise.resolve(null) : getEmployeeById(numId),
    listBranches(),
    listDepartments(),
  ]);

  const userEmail = session.user?.email ?? "";
  const userRole = (session.user as { role?: string } | undefined)?.role ?? "";
  const userName = session.user?.name ?? null;

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      {employee ? (
        <EmployeeForm
          branches={branches}
          departments={departments}
          mode="edit"
          employee={employee}
          action={updateEmployee}
        />
      ) : (
        <div className="min-h-full bg-slate-50">
          <div className="max-w-xl mx-auto px-6 py-24 text-center">
            <h1 className="text-2xl font-semibold text-slate-900">Employee not found</h1>
            <p className="mt-2 text-sm text-slate-600">The employee you&apos;re trying to edit doesn&apos;t exist.</p>
            <Link
              href="/dashboard-employee-management"
              className="mt-6 inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Back to Employees
            </Link>
          </div>
        </div>
      )}
    </AppShell>
  );
}
