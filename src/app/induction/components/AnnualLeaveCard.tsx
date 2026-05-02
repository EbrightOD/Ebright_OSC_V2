import type { LeaveOnDateRow } from "@/app/induction/queries";

interface Props {
  rows: LeaveOnDateRow[];
}

export function AnnualLeaveCard({ rows }: Props) {
  return (
    <div className="rounded-lg border border-indigo-300 bg-indigo-50 p-6 shadow-sm">
      <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
        Annual Leave
      </h3>
      <p className="mt-0.5 text-xs text-indigo-700">Today</p>

      <div className="mt-4 flex gap-5">
        <div className="shrink-0 text-center min-w-[80px]">
          <div className="text-5xl font-bold leading-none tabular-nums text-indigo-900">
            {rows.length}
          </div>
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-700">
            Today
          </div>
        </div>
        <div className="min-w-0 flex-1">
          {rows.length === 0 ? (
            <p className="mt-2 text-sm italic text-indigo-800/80">No Annual Leave for today</p>
          ) : (
            <ul className="space-y-1 text-sm text-indigo-900">
              {rows.map((r) => (
                <li key={r.leaveId} className="truncate">
                  <span className="font-medium">{r.fullName}</span>
                  <span className="text-indigo-700">
                    {" — "}
                    {r.startDate}
                    {r.startDate !== r.endDate ? ` to ${r.endDate}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
