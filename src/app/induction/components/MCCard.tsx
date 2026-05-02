import type { LeaveOnDateRow } from "@/app/induction/queries";

interface Props {
  rows: LeaveOnDateRow[];
}

export function MCCard({ rows }: Props) {
  return (
    <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-6 shadow-sm">
      <h3 className="text-xs font-bold uppercase tracking-wider text-yellow-900">MC</h3>
      <p className="mt-0.5 text-xs text-yellow-700">Today</p>

      <div className="mt-4 flex gap-5">
        <div className="shrink-0 text-center min-w-[80px]">
          <div className="text-5xl font-bold leading-none tabular-nums text-yellow-900">
            {rows.length}
          </div>
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-yellow-700">
            Today
          </div>
        </div>
        <div className="min-w-0 flex-1">
          {rows.length === 0 ? (
            <p className="mt-2 text-sm italic text-yellow-800/80">No MC for today</p>
          ) : (
            <ul className="space-y-1 text-sm text-yellow-900">
              {rows.map((r) => (
                <li key={r.leaveId} className="truncate">
                  <span className="font-medium">{r.fullName}</span>
                  <span className="text-yellow-700">
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
