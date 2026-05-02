import Link from "next/link";

interface Props {
  todayCount: number;
  oneWeekCount: number;
  sixMonthCount: number;
}

export function OnboardingCard({ todayCount, oneWeekCount, sixMonthCount }: Props) {
  return (
    <Link
      href="/induction/hr-dashboard/onboarding-detail"
      className="block rounded-lg border border-emerald-300 bg-emerald-50 p-6 shadow-sm transition hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
    >
      <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
        Onboarding
      </h3>
      <p className="mt-0.5 text-xs text-emerald-700">Today → +6 months</p>

      <div className="mt-4 text-center">
        <div className="text-5xl font-bold leading-none tabular-nums text-emerald-900">
          {todayCount}
        </div>
        <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
          Today
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <div
          className={`rounded-md p-2 text-center ${
            oneWeekCount > 0 ? "bg-emerald-200" : "bg-white"
          }`}
        >
          <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
            +1 Week
          </div>
          <div className="text-lg font-bold tabular-nums text-emerald-900">{oneWeekCount}</div>
        </div>
        <div className="rounded-md bg-white p-2 text-center">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
            +6 Months
          </div>
          <div className="text-lg font-bold tabular-nums text-emerald-900">{sixMonthCount}</div>
        </div>
      </div>

      <p className="mt-4 text-center text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
        Click to view detail
      </p>
    </Link>
  );
}
