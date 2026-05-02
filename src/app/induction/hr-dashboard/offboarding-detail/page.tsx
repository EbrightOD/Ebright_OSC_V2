import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { ArrowLeft } from "lucide-react";
import { authOptions } from "@/lib/nextauth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/app/components/AppShell";
import { BulkAddToQueueButton } from "@/app/induction/components/BulkAddToQueueButton";
import { HRMSSidebar } from "@/app/induction/components/HRMSSidebar";
import { canManageInductions } from "@/app/induction/roles";
import { getUpcomingExits } from "@/app/induction/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Offboarding Detail",
};

export default async function OffboardingDetailPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const actor = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { role: { select: { role_type: true } } },
  });
  const canManage = canManageInductions(actor?.role?.role_type ?? null);
  if (!canManage) redirect("/dashboards/hrms");

  const exits = await getUpcomingExits(60);
  const highlightedUserIds = exits
    .filter((e) => e.isWithin7Days && !e.hasPendingRequest && e.inductionProfileStatus === null)
    .map((e) => e.userId);

  const userEmail = session.user.email;
  const userRole = actor?.role?.role_type ?? "";
  const userName = session.user.name ?? null;

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <div className="flex min-h-full bg-slate-50">
        <HRMSSidebar canManageInductions={canManage} />
        <div className="flex-1 min-w-0">
          <header className="bg-rose-600 text-white px-6 py-5">
            <div className="max-w-6xl mx-auto">
              <Link
                href="/induction/hr-dashboard"
                className="inline-flex items-center gap-1 text-rose-100 text-sm hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                Back to Overview
              </Link>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                Offboarding (Today → +1 month) [{exits.length}]
              </h1>
              <p className="text-sm text-rose-100">Green = within 1 week</p>
            </div>
          </header>

          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="rounded-lg border border-slate-200 bg-white overflow-x-auto shadow-sm">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left font-medium">#</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium">Name</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium">Position</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium">Department</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium">End Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {exits.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                        No upcoming exits in the next month.
                      </td>
                    </tr>
                  ) : (
                    exits.map((e, i) => (
                      <tr
                        key={e.userId}
                        className={e.isWithin7Days ? "bg-emerald-50" : "bg-white"}
                      >
                        <td className="px-4 py-3 text-slate-500 tabular-nums">{i + 1}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {e.isWithin7Days && (
                            <span className="text-emerald-600 mr-1.5" aria-hidden="true">●</span>
                          )}
                          {e.fullName}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{e.position ?? "—"}</td>
                        <td className="px-4 py-3 text-slate-700">{e.departmentName ?? "—"}</td>
                        <td className="px-4 py-3 text-slate-700">{e.endDate}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <BulkAddToQueueButton userIds={highlightedUserIds} accent="rose" />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
