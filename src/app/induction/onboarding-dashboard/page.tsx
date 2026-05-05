import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/app/components/AppShell";
import OnboardingDashboard from "@/app/induction/components/OnboardingDashboard";
import { HRMSSidebar } from "@/app/induction/components/HRMSSidebar";
import { canManageInductions } from "@/app/induction/roles";
import {
  getCombinedUpcomingExits,
  getCombinedUpcomingHires,
  getOwnInductionView,
} from "@/app/induction/queries";
import {
  shouldRunSync,
  syncAllFromEbrightLeads,
} from "@/app/induction/jobs/sync-onboarding";

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
  title: "Onboarding Dashboard",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function OnboardingDashboardPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const actor = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { user_id: true, role: { select: { role_type: true } } },
  });
  const canManage = canManageInductions(actor?.role?.role_type ?? null);
  if (!canManage) {
    redirect("/dashboards/hrms");
  }

  const params = await searchParams;
  const rawType = typeof params.type === "string" ? params.type : "";
  const view: "onboarding" | "offboarding" | "both" =
    rawType === "onboarding"
      ? "onboarding"
      : rawType === "offboarding"
        ? "offboarding"
        : "both";

  await maybeAutoSync();

  const fetchHires = view !== "offboarding";
  const fetchExits = view !== "onboarding";

  // Induction request windows (long-term rule, see memory):
  //   Onboarding:  |daysUntilStart| <= 7        → ±1 week from start_date
  //   Offboarding: 0 <= daysUntilEnd <= 14      → up to 2 weeks BEFORE end_date
  // Rationale: induction takes ~1 week to complete. Onboarding shows from the
  // week before through the week after start_date (still onboarding either
  // way). Offboarding only shows future leavers (employees who already left
  // can't be inducted) within the next 2 weeks so they have time to settle.
  const [hiresAll, exitsAll, ownInduction] = await Promise.all([
    fetchHires ? getCombinedUpcomingHires(7, 7) : Promise.resolve([]),
    fetchExits ? getCombinedUpcomingExits(14, 0) : Promise.resolve([]),
    actor ? getOwnInductionView(actor.user_id) : Promise.resolve(null),
  ]);

  const hires = hiresAll.filter((h) => Math.abs(h.daysUntilStart) <= 7);
  const exits = exitsAll.filter(
    (e) => e.daysUntilEnd >= 0 && e.daysUntilEnd <= 14,
  );

  const userEmail = session.user.email;
  const userRole = actor?.role?.role_type ?? "";
  const userName = session.user.name ?? null;

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <div className="flex min-h-full bg-slate-50">
        <HRMSSidebar canManageInductions={canManage} />
        <div className="flex-1 min-w-0">
          <OnboardingDashboard
            hires={hires}
            exits={exits}
            view={view}
            ownInduction={ownInduction}
            isManager={canManage}
          />
        </div>
      </div>
    </AppShell>
  );
}
