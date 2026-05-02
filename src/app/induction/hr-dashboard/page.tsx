import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { ArrowLeft } from "lucide-react";
import { authOptions } from "@/lib/nextauth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/app/components/AppShell";
import { canManageInductions } from "@/app/induction/roles";
import { HRMSSidebar } from "@/app/induction/components/HRMSSidebar";
import { OnboardingCard } from "@/app/induction/components/OnboardingCard";
import { OffboardingCard } from "@/app/induction/components/OffboardingCard";
import { MCCard } from "@/app/induction/components/MCCard";
import { AnnualLeaveCard } from "@/app/induction/components/AnnualLeaveCard";
import {
  getLeavesActiveToday,
  getUpcomingExits,
  getUpcomingHires,
} from "@/app/induction/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "HR Dashboard",
};

export default async function HrDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const actor = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { role: { select: { role_type: true } } },
  });
  const canManage = canManageInductions(actor?.role?.role_type ?? null);
  if (!canManage) redirect("/dashboards/hrms");

  const [hires, exits, mcLeaves, annualLeaves] = await Promise.all([
    getUpcomingHires(180),
    getUpcomingExits(60),
    getLeavesActiveToday("MC"),
    getLeavesActiveToday("AL"),
  ]);

  const onbToday = hires.filter((h) => h.daysUntilStart <= 0).length;
  const onbOneWeek = hires.filter((h) => h.isWithin7Days).length;
  const onbSixMonth = hires.length;

  const offToday = exits.filter((e) => e.daysUntilEnd <= 0).length;
  const offOneWeek = exits.filter((e) => e.isWithin7Days).length;
  const offOneMonth = exits.filter((e) => e.daysUntilEnd <= 30).length;

  const userEmail = session.user.email;
  const userRole = actor?.role?.role_type ?? "";
  const userName = session.user.name ?? null;

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <div className="flex min-h-full bg-slate-50">
        <HRMSSidebar canManageInductions={canManage} />
        <div className="flex-1 min-w-0">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <header className="flex flex-wrap items-end justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
                  HR Dashboard
                </h1>
                <p className="mt-1 text-sm text-slate-600">Employee Lifecycle Data</p>
              </div>
              <Link
                href="/dashboards/hrms"
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                Back to HRMS
              </Link>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <OnboardingCard
                todayCount={onbToday}
                oneWeekCount={onbOneWeek}
                sixMonthCount={onbSixMonth}
              />
              <OffboardingCard
                todayCount={offToday}
                oneWeekCount={offOneWeek}
                oneMonthCount={offOneMonth}
              />
              <MCCard rows={mcLeaves} />
              <AnnualLeaveCard rows={annualLeaves} />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
