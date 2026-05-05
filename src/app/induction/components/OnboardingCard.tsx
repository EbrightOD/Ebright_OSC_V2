import Link from "next/link";
import { UserPlus } from "lucide-react";
import { CardHoverPreview, type HoverPreviewItem } from "./CardHoverPreview";

interface Props {
  total: number;
  windowLabel: string;
  previewItems?: HoverPreviewItem[];
  previewSide?: "right" | "left" | "below";
}

export function OnboardingCard({
  total,
  windowLabel,
  previewItems = [],
  previewSide = "right",
}: Props) {
  return (
    <div className="group relative">
      <Link
        href="/induction/hr-dashboard/onboarding-detail"
        className="relative block overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-emerald-100 to-teal-100 p-8 shadow-sm transition hover:shadow-xl hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
      >
        {/* Decorative blur */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 -bottom-10 h-36 w-36 rounded-full bg-teal-300/20 blur-3xl" />

        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md">
                <UserPlus className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-emerald-900">
                Onboarding
              </h3>
            </div>
            <p className="mt-2 text-xs font-medium text-emerald-700">{windowLabel}</p>
          </div>
        </div>

        <div className="relative mt-6 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
              Total
            </p>
            <p className="mt-1 text-7xl font-black leading-none tabular-nums text-emerald-900 drop-shadow-sm">
              {total}
            </p>
          </div>
          <span className="rounded-full bg-emerald-600/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-800">
            Hover · Click
          </span>
        </div>
      </Link>

      <CardHoverPreview
        accent="emerald"
        side={previewSide}
        title="Onboarding Pipeline"
        items={previewItems}
        emptyText="No upcoming hires."
        totalLabel={`${total} total`}
        footer="Highlighted rows start within 7 days."
      />
    </div>
  );
}
