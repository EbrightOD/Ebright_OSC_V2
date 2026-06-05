import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/app/components/AppShell";
import { OffboardingDashboardView } from "./OffboardingDashboardView";
import {
  computeOffboardingStats,
  listOffboardingCases,
} from "@/lib/offboarding/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Offboarding",
};

/**
 * Offboarding dashboard — HR-facing list of all offboarding cases.
 *
 * Access (PR1):
 *   - superadmin / admin / hr / od / hod → full read-only view
 *   - Everyone else → redirected to /dashboards/hrms
 *
 * Read-only in PR1. The "+ New Offboarding" button is disabled. Click
 * a row → /dashboards/offboarding/[caseId] for the read-only detail
 * page. Real create + advance flows arrive in Phases 2-5.
 */
const ALLOWED_ROLES = new Set(["superadmin", "admin", "hr", "od", "hod"]);

export default async function OffboardingDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const actor = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { user_id: true, role: { select: { role_type: true } } },
  });
  const roleType = (actor?.role?.role_type ?? "").toLowerCase();
  if (!ALLOWED_ROLES.has(roleType)) {
    redirect("/dashboards/hrms");
  }

  const [cases, stats] = await Promise.all([
    listOffboardingCases(),
    computeOffboardingStats(),
  ]);

  return (
    <AppShell
      email={session.user.email}
      role={actor?.role?.role_type ?? ""}
      name={session.user.name ?? null}
    >
      <OffboardingDashboardView
        cases={cases}
        stats={stats}
        currentUserId={actor?.user_id ?? 0}
      />
    </AppShell>
  );
}
