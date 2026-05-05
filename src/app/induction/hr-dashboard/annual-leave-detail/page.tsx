import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { ArrowLeft } from "lucide-react";
import { authOptions } from "@/lib/nextauth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/app/components/AppShell";
import { HRMSSidebar } from "@/app/induction/components/HRMSSidebar";
import { canManageInductions } from "@/app/induction/roles";
import { getCombinedAnnualLeavesPastWeek } from "@/app/induction/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Annual Leave Detail",
};

export default async function AnnualLeaveDetailPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const actor = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { role: { select: { role_type: true } } },
  });
  const canManage = canManageInductions(actor?.role?.role_type ?? null);
  if (!canManage) redirect("/dashboards/hrms");

  const rows = await getCombinedAnnualLeavesPastWeek();

  const userEmail = session.user.email;
  const userRole = actor?.role?.role_type ?? "";
  const userName = session.user.name ?? null;

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <div className="flex min-h-full bg-slate-50">
        <HRMSSidebar canManageInductions={canManage} />
        <div className="flex-1 min-w-0">
          <header className="bg-indigo-600 text-white px-6 py-5">
            <div className="max-w-6xl mx-auto">
              <Link
                href="/induction/hr-dashboard"
                className="inline-flex items-center gap-1 text-indigo-100 text-sm hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                Back to Overview
              </Link>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                Annual Leave (-1 week → today) [{rows.length}]
              </h1>
              <p className="text-sm text-indigo-100">
                Combined from local leave records and ebrightleads_db
              </p>
            </div>
          </header>

          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="rounded-lg border border-slate-200 bg-white overflow-x-auto shadow-sm">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left font-medium">#</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium">Name</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium">Department / Branch</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium">Duration / Type</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium">Date</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                        No annual leave in the past week.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r, i) => {
                      const isLocal = r.leaveId > 0;
                      return (
                        <tr key={`${isLocal ? "local" : "ebr"}-${r.leaveId}`} className="bg-white">
                          <td className="px-4 py-3 text-slate-500 tabular-nums">{i + 1}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">{r.fullName}</td>
                          <td className="px-4 py-3 text-slate-700">{r.email}</td>
                          <td className="px-4 py-3 text-slate-700">{r.leaveTypeName}</td>
                          <td className="px-4 py-3 text-slate-700">
                            {r.startDate}
                            {r.startDate !== r.endDate ? ` → ${r.endDate}` : ""}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            <span className={
                              isLocal
                                ? "rounded bg-slate-100 px-2 py-0.5 text-slate-700"
                                : "rounded bg-blue-100 px-2 py-0.5 text-blue-700"
                            }>
                              {isLocal ? "hrfs" : "ebrightleads"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
