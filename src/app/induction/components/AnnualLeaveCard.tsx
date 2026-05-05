import Link from "next/link";
import { Plane } from "lucide-react";
import type { LeaveOnDateRow } from "@/app/induction/queries";
import { CardHoverPreview, type HoverPreviewItem } from "./CardHoverPreview";
import { titleCaseName } from "@/lib/text";

interface Props {
  rows: LeaveOnDateRow[];
  previewSide?: "right" | "left" | "below";
}

export function AnnualLeaveCard({ rows, previewSide = "left" }: Props) {
  const previewItems: HoverPreviewItem[] = rows.slice(0, 8).map((r) => ({
    key: `al-${r.leaveId}`,
    title: titleCaseName(r.fullName) || r.fullName,
    subtitle: r.leaveTypeName,
    meta: r.startDate === r.endDate ? r.startDate : `${r.startDate} → ${r.endDate}`,
  }));

  const front = rows.slice(0, 3);

  return (
    <div className="group relative">
      <Link
        href="/induction/hr-dashboard/annual-leave-detail"
        className="relative block overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-violet-100 to-purple-100 p-6 shadow-sm transition hover:shadow-xl hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
      >
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-violet-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 -bottom-10 h-36 w-36 rounded-full bg-indigo-300/20 blur-3xl" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
                <Plane className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-indigo-900">
                Annual Leave
              </h3>
            </div>
            <p className="mt-2 text-xs font-medium text-indigo-700">-1 week → today</p>

            <ul className="mt-4 space-y-1.5">
              {front.length === 0 ? (
                <li className="text-sm italic text-indigo-800/70">No annual leave in the past week.</li>
              ) : (
                front.map((r) => (
                  <li
                    key={r.leaveId}
                    className="rounded-lg bg-white/60 px-3 py-1.5 text-sm text-indigo-950 backdrop-blur-sm"
                  >
                    <p className="truncate font-semibold">
                      {titleCaseName(r.fullName) || r.fullName}
                    </p>
                    <p className="truncate text-xs text-indigo-800">
                      {r.leaveTypeName} · {r.startDate}
                    </p>
                  </li>
                ))
              )}
              {rows.length > front.length && (
                <li className="px-3 pt-1 text-xs font-semibold uppercase tracking-wide text-indigo-800">
                  +{rows.length - front.length} more
                </li>
              )}
            </ul>
          </div>

          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-700">
              Total
            </p>
            <p className="mt-1 text-5xl font-black leading-none tabular-nums text-indigo-900 drop-shadow-sm">
              {rows.length}
            </p>
          </div>
        </div>

        <p className="relative mt-5 text-center text-[10px] font-semibold uppercase tracking-wider text-indigo-700">
          Hover for full list · Click to view detail
        </p>
      </Link>

      <CardHoverPreview
        accent="indigo"
        side={previewSide}
        title="Recent Annual Leave"
        items={previewItems}
        emptyText="No annual leave in the past week."
        totalLabel={`${rows.length} total · showing top ${Math.min(rows.length, 8)}`}
      />
    </div>
  );
}
