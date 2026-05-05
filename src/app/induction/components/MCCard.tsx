import Link from "next/link";
import { Stethoscope } from "lucide-react";
import type { LeaveOnDateRow } from "@/app/induction/queries";
import { CardHoverPreview, type HoverPreviewItem } from "./CardHoverPreview";
import { titleCaseName } from "@/lib/text";

interface Props {
  rows: LeaveOnDateRow[];
  previewSide?: "right" | "left" | "below";
}

export function MCCard({ rows, previewSide = "right" }: Props) {
  const previewItems: HoverPreviewItem[] = rows.slice(0, 8).map((r) => ({
    key: `mc-${r.leaveId}`,
    title: titleCaseName(r.fullName) || r.fullName,
    subtitle: r.leaveTypeName,
    meta: r.startDate === r.endDate ? r.startDate : `${r.startDate} → ${r.endDate}`,
  }));

  const front = rows.slice(0, 3);

  return (
    <div className="group relative">
      <Link
        href="/induction/hr-dashboard/mc-detail"
        className="relative block overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-yellow-100 to-orange-100 p-6 shadow-sm transition hover:shadow-xl hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
      >
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-yellow-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 -bottom-10 h-36 w-36 rounded-full bg-orange-300/20 blur-3xl" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md">
                <Stethoscope className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-amber-900">
                MC
              </h3>
            </div>
            <p className="mt-2 text-xs font-medium text-amber-700">-1 week → today</p>

            <ul className="mt-4 space-y-1.5">
              {front.length === 0 ? (
                <li className="text-sm italic text-amber-800/70">No MC in the past week.</li>
              ) : (
                front.map((r) => (
                  <li
                    key={r.leaveId}
                    className="rounded-lg bg-white/60 px-3 py-1.5 text-sm text-amber-950 backdrop-blur-sm"
                  >
                    <p className="truncate font-semibold">
                      {titleCaseName(r.fullName) || r.fullName}
                    </p>
                    <p className="truncate text-xs text-amber-800">
                      {r.leaveTypeName} · {r.startDate}
                    </p>
                  </li>
                ))
              )}
              {rows.length > front.length && (
                <li className="px-3 pt-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
                  +{rows.length - front.length} more
                </li>
              )}
            </ul>
          </div>

          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">
              Total
            </p>
            <p className="mt-1 text-5xl font-black leading-none tabular-nums text-amber-900 drop-shadow-sm">
              {rows.length}
            </p>
          </div>
        </div>

        <p className="relative mt-5 text-center text-[10px] font-semibold uppercase tracking-wider text-amber-700">
          Hover for full list · Click to view detail
        </p>
      </Link>

      <CardHoverPreview
        accent="yellow"
        side={previewSide}
        title="Recent MC"
        items={previewItems}
        emptyText="No MC records in the past week."
        totalLabel={`${rows.length} total · showing top ${Math.min(rows.length, 8)}`}
      />
    </div>
  );
}
