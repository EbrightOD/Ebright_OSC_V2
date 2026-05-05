import {
  getOnboardingCandidateCounts,
  getOnboardingCandidatesByType,
} from "@/app/induction/queries";
import {
  shouldRunSync,
  syncAllFromEbrightLeads,
} from "@/app/induction/jobs/sync-onboarding";
import { prisma } from "@/lib/prisma";
import { CandidateCountCard } from "./CandidateCountCard";
import { SyncButton } from "./SyncButton";

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

export async function EbrightLeadsPanel() {
  await maybeAutoSync();

  const [counts, onboarding, offboarding, recentJoins, active, lastSyncRow] =
    await Promise.all([
      getOnboardingCandidateCounts(),
      getOnboardingCandidatesByType("onboarding"),
      getOnboardingCandidatesByType("offboarding"),
      getOnboardingCandidatesByType("recent_join"),
      getOnboardingCandidatesByType("active"),
      prisma.onboarding_candidate.findFirst({
        orderBy: { synced_at: "desc" },
        select: { synced_at: true },
      }),
    ]);

  const lastSyncedAt = lastSyncRow?.synced_at ?? null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Employee Lifecycle (ebrightleads)</h2>
          <p className="text-sm text-gray-600">
            Synced from <code>hr_staff_movements</code>
            {lastSyncedAt && (
              <>
                {" "}
                · last synced{" "}
                <time dateTime={lastSyncedAt.toISOString()}>
                  {lastSyncedAt.toLocaleString()}
                </time>
              </>
            )}
          </p>
          <p className="text-xs text-gray-500">
            Auto-syncs when this page is opened and the last sync is over 1 hour old.
          </p>
        </div>
        <SyncButton />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <CandidateCountCard
          title="ONBOARDING"
          subtitle="Joining today onward"
          count={counts.onboarding}
          color="green"
          type="onboarding"
          candidates={onboarding}
        />
        <CandidateCountCard
          title="OFFBOARDING"
          subtitle="Exiting in next 30 days"
          count={counts.offboarding}
          color="red"
          type="offboarding"
          candidates={offboarding}
        />
        <CandidateCountCard
          title="RECENT JOINS"
          subtitle="Joined in last 30 days"
          count={counts.recentJoins}
          color="blue"
          type="recent_join"
          candidates={recentJoins}
        />
        <CandidateCountCard
          title="ACTIVE"
          subtitle="Currently employed"
          count={counts.active}
          color="purple"
          type="active"
          candidates={active}
        />
      </div>
    </section>
  );
}
