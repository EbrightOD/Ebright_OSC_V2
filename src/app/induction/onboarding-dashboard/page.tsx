import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/app/components/AppShell";
import OnboardingDashboard from "@/app/induction/components/OnboardingDashboard";
import { HRMSSidebar } from "@/app/induction/components/HRMSSidebar";
import { canManageInductions } from "@/app/induction/roles";
import {
  getOwnInductionView,
  getUpcomingExits,
  getUpcomingHires,
} from "@/app/induction/queries";

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

  const fetchHires = view !== "offboarding";
  const fetchExits = view !== "onboarding";

  const [hires, exits, ownInduction] = await Promise.all([
    fetchHires ? getUpcomingHires(180) : Promise.resolve([]),
    fetchExits ? getUpcomingExits(60) : Promise.resolve([]),
    actor ? getOwnInductionView(actor.user_id) : Promise.resolve(null),
  ]);

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
