import Link from "next/link";
import { WorkflowDiagram } from "./WorkflowDiagram";
import { TrainingChecklist } from "./TrainingChecklist";
import type { InductionView } from "@/app/induction/queries";

interface PersonalInductionViewProps {
  profile: InductionView;
  canMarkComplete: boolean;
}

function formatLongDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function PersonalInductionView({
  profile,
  canMarkComplete,
}: PersonalInductionViewProps) {
  const total = profile.steps.length;
  const completed = profile.steps.filter((s) => s.status === "Completed").length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isComplete = total > 0 && completed === total;
  const isHalfway = total > 0 && completed >= Math.ceil(total / 2) && !isComplete;

  const isOffboarding = profile.inductionType === "Offboarding";

  const headline = isOffboarding
    ? `Farewell, ${profile.employeeName}.`
    : `Welcome, ${profile.employeeName}!`;

  const subline = isOffboarding
    ? `Your last working day is ${formatLongDate(profile.exitDate ?? profile.startDate)}.`
    : `You join ${profile.departmentName ?? "the team"} on ${formatLongDate(profile.startDate)}.`;

  const journeyTitle = isOffboarding ? "Offboarding Process" : "Onboarding Journey";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            {profile.inductionType}
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
            {headline}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600">{subline}</p>

          {profile.buddyName && (
            <div className="mt-5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <p className="text-sm font-medium text-amber-900">
                Your induction buddy is {profile.buddyName}
                {profile.buddyEmail && (
                  <>
                    {" — "}
                    <a
                      href={`mailto:${profile.buddyEmail}`}
                      className="underline underline-offset-2 hover:text-amber-700"
                    >
                      {profile.buddyEmail}
                    </a>
                  </>
                )}
              </p>
            </div>
          )}

          <div className="mt-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Progress</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {completed} of {total} steps complete
                </p>
              </div>
              <span className="text-2xl font-semibold tabular-nums text-slate-900">{pct}%</span>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-[width] duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            {isHalfway && (
              <p className="mt-3 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-900">
                You&rsquo;re halfway there — keep going!
              </p>
            )}
            {!canMarkComplete && (
              <p className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                Read-only view — sign in as the employee or HR to mark steps complete.
              </p>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
            <header className="mb-4">
              <h2 className="text-base font-semibold text-slate-900">{journeyTitle}</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Your end-to-end flow at a glance.
              </p>
            </header>
            <WorkflowDiagram steps={profile.steps} />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
            <header className="mb-4">
              <h2 className="text-base font-semibold text-slate-900">Your checklist</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Mark each task complete as you go.
              </p>
            </header>
            <TrainingChecklist
              steps={profile.steps}
              token={profile.linkToken}
              canMarkComplete={canMarkComplete}
            />
          </section>
        </div>

        {isComplete && (
          <footer className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <h2 className="text-lg font-semibold text-emerald-900">
              {isOffboarding ? "Offboarding Complete" : "Onboarding Complete!"}
            </h2>
            <p className="mt-1 text-sm text-emerald-800">
              {isOffboarding
                ? "All exit steps are signed off. Wishing you the best for what comes next."
                : "You&rsquo;ve finished every step. Welcome aboard."}
            </p>
            <Link
              href="/dashboards/hrms"
              className="mt-4 inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Return to HRMS
            </Link>
          </footer>
        )}

        <div className="text-center text-xs text-slate-400">
          This is your private induction link. Don&rsquo;t share it with others.
        </div>
      </div>
    </div>
  );
}
