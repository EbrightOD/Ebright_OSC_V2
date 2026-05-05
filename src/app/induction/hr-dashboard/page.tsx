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
  shouldRunSync,
  syncAllFromEbrightLeads,
} from "@/app/induction/jobs/sync-onboarding";
import {
  getCombinedAnnualLeavesPastWeek,
  getCombinedMcLeavesPastWeek,
  getCombinedUpcomingExits,
  getCombinedUpcomingHires,
} from "@/app/induction/queries";

async function maybeAutoSync(): Promise<void> {
  try {
    if (await shouldRunSync()) {
      await syncAllFromEbrightLeads();
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[induction] auto-sync skipped:", msg);
  }
}

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

  await maybeAutoSync();

  const [hires, exits, mcLeaves, annualLeaves] = await Promise.all([
    // -1 week → +6 months window for onboarding
    getCombinedUpcomingHires(180, 7),
    // -1 week → +2 months window for offboarding (HR may still need to wrap
    // up offboarding induction for employees in their final week / just-left).
    getCombinedUpcomingExits(60, 7),
    getCombinedMcLeavesPastWeek(),
    getCombinedAnnualLeavesPastWeek(),
  ]);

  const onboardingPreview = hires.slice(0, 8).map((h) => ({
    key: h.key,
    title: h.fullName,
    subtitle: [h.position, h.departmentName].filter(Boolean).join(" · ") || null,
    meta: `Starts ${h.startDate} · in ${h.daysUntilStart}d`,
    highlight: h.isWithin7Days,
  }));

  const offboardingPreview = exits.slice(0, 8).map((e) => ({
    key: e.key,
    title: e.fullName,
    subtitle: [e.position, e.departmentName].filter(Boolean).join(" · ") || null,
    meta: `Leaves ${e.endDate} · in ${e.daysUntilEnd}d`,
    highlight: e.isWithin7Days,
  }));

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
                total={hires.length}
                windowLabel="-1 week → +6 months"
                previewItems={onboardingPreview}
              />
              <OffboardingCard
                total={exits.length}
                windowLabel="-1 week → +2 months"
                previewItems={offboardingPreview}
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
