import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/app/components/AppShell";
import OnboardingDashboard from "@/app/induction/components/OnboardingDashboard";
import { canManageInductions } from "@/app/induction/roles";
import { listBranches } from "@/lib/employeeQueries";
import {
  getCombinedUpcomingExits,
  getCombinedUpcomingHires,
  getOwnInductionView,
  listAllInductionProfiles,
  listAllSubstepTemplates,
  listDepartments,
  listInductionEligibleEmployees,
  listPendingInductionRequests,
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
  // Onboarding view (Phase 2B): fetch all profiles + pending requests
  // for the stats row, category filter, pending list, and candidates table.
  // Offboarding view: skip these — keeps the original lightweight payload.
  const fetchOnboardingExtras = view === "onboarding";

  const [
    hiresAll,
    exitsAll,
    ownInduction,
    substepTemplates,
    departments,
    allProfiles,
    pendingRequests,
    branches,
    branchByUserId,
    activeUsers,
  ] = await Promise.all([
    fetchHires ? getCombinedUpcomingHires(7, 7) : Promise.resolve([]),
    fetchExits ? getCombinedUpcomingExits(14, 0) : Promise.resolve([]),
    actor ? getOwnInductionView(actor.user_id) : Promise.resolve(null),
    listAllSubstepTemplates(),
    listDepartments(),
    fetchOnboardingExtras ? listAllInductionProfiles() : Promise.resolve([]),
    fetchOnboardingExtras ? listPendingInductionRequests() : Promise.resolve([]),
    fetchOnboardingExtras ? listBranches() : Promise.resolve([]),
    fetchOnboardingExtras ? fetchBranchByUserId() : Promise.resolve({}),
    fetchOnboardingExtras ? fetchActiveUsersForReportsTo() : Promise.resolve([]),
  ]);

  // Phase B: fetch eligible employees for the "+ New Candidate" modal email lookup
  const eligibleEmployees = fetchOnboardingExtras
    ? await listInductionEligibleEmployees()
    : [];

  const hires = hiresAll.filter((h) => Math.abs(h.daysUntilStart) <= 7);
  const exits = exitsAll.filter(
    (e) => e.daysUntilEnd >= 0 && e.daysUntilEnd <= 14,
  );

  // For the new HR view: only show onboarding profiles (not offboarding) in
  // the candidates table + stats. Excludes role-assigned candidates (promoted
  // out of the pipeline via the admin Assign Role flow).
  //
  // A6 fix: the 5-day `isArchived` window (start_date older than 5 days) is
  // NOT applied here. The Employee Dashboard counts the same induction_profile
  // table with no start-date filter, so excluding "archived" candidates made
  // this page show 0 while the Employee Dashboard still listed them (e.g.
  // candidates whose start_date is already a few days past). Both pages now
  // reflect the same active onboarding pool.
  const onboardingProfiles = allProfiles.filter(
    (p) => p.inductionType !== "Offboarding" && p.status !== "Assigned",
  );

  const userEmail = session.user.email;
  const userRole = actor?.role?.role_type ?? "";
  const userName = session.user.name ?? null;

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <OnboardingDashboard
        hires={hires}
        exits={exits}
        view={view}
        ownInduction={ownInduction}
        isManager={canManage}
        substepTemplates={substepTemplates}
        departments={departments}
        onboardingProfiles={onboardingProfiles}
        pendingRequests={pendingRequests}
        branches={branches}
        branchByUserId={branchByUserId}
        activeUsers={activeUsers}
        eligibleEmployees={eligibleEmployees}
      />
    </AppShell>
  );
}

/** userId → branchName lookup for the Branch column in the candidates table. */
async function fetchBranchByUserId(): Promise<Record<number, string | null>> {
  const rows = await prisma.employment.findMany({
    where: { status: { in: ["active", "onboarding"] } },
    include: { branch: { select: { branch_name: true } } },
    orderBy: { start_date: "desc" },
  });
  const out: Record<number, string | null> = {};
  for (const r of rows) {
    if (!(r.user_id in out)) {
      out[r.user_id] = r.branch?.branch_name ?? null;
    }
  }
  return out;
}

interface ActiveUserOption {
  userId: number;
  fullName: string;
  email: string;
  position: string | null;
}

/** Active users with manager-tier roles, for the "Reports To" dropdown in
 *  the Assign Role modal. */
async function fetchActiveUsersForReportsTo(): Promise<ActiveUserOption[]> {
  const REPORTS_TO_ROLES = new Set(["superadmin", "ceo", "admin", "hr", "od", "hod"]);
  const rows = await prisma.users.findMany({
    where: { status: "active" },
    include: {
      user_profile: { select: { full_name: true } },
      role: { select: { role_type: true } },
      employment: {
        where: { status: "active" },
        orderBy: { start_date: "desc" },
        take: 1,
        select: { position: true },
      },
    },
    orderBy: { email: "asc" },
  });
  type Row = (typeof rows)[number];
  return rows
    .filter((u: Row) => REPORTS_TO_ROLES.has((u.role?.role_type ?? "").toLowerCase()))
    .map((u: Row) => ({
      userId: u.user_id,
      fullName: u.user_profile?.full_name ?? u.email,
      email: u.email,
      position: u.employment[0]?.position ?? null,
    }));
}
