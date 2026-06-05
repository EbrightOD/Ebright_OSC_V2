"use client";

import Link from "next/link";
import { initialsFromName } from "@/lib/text";
import { useRef, useState, type ComponentType, type SVGProps } from "react";
import {
  Users,
  Building2,
  Network,
  UserPlus,
} from "lucide-react";
import {
  typeForWorkflowTemplate,
  type EmployeeTypeKey,
} from "@/lib/induction-task-spec";

/**
 * Employee Dashboard amendment per spec:
 *   - 5 stat cards (Total Staff / Branches / Departments / Onboarding /
 *     Completed) with colored top strip + faint icon watermark.
 *   - Total Staff / Branches / Departments are display-only.
 *   - Onboarding + Completed are clickable → toggle the panel below,
 *     pre-filtered. Same-page interaction, no navigation.
 *   - Completion alert strip above the panel when there are completed
 *     candidates waiting for role assignment.
 *
 * Imported by EmployeeListView and rendered above the existing employees
 * table. Pure presentational + local state — no fetching here.
 */

export interface OverviewStats {
  totalStaff: number;
  branchCount: number;
  departmentCount: number;
  onboardingActive: number;
  onboardingCompleted: number;
}

export interface CandidatePanelRow {
  id: number;
  userId: number;
  employeeName: string;
  employeeEmail: string;
  workflowTemplate: string;
  /** "Sent" | "Created" | "In Progress" | "Completed" — from induction_profile.status */
  status: string;
  /** Department name from active/onboarding employment; null if unassigned. */
  departmentName: string | null;
  /** Branch code (HQ, PJY, KL, etc.) — short pill in the table. Null if unassigned. */
  branchCode: string | null;
}

interface Props {
  stats: OverviewStats;
  /** All onboarding candidates (any status). Filtered client-side by the
   *  active panel filter. Cap upstream at 50 rows or pass them all — the
   *  panel itself caps at 50 visible. */
  candidates: CandidatePanelRow[];
}

type PanelFilter = "active" | "completed" | null;

export function EmployeeDashboardOverviewSection({ stats, candidates }: Props) {
  const [filter, setFilter] = useState<PanelFilter>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const openFilter = (f: Exclude<PanelFilter, null>) => {
    setFilter((cur) => (cur === f ? null : f));
    // Defer scroll until panel renders
    requestAnimationFrame(() => {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <div className="mb-6 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Staff"
          value={stats.totalStaff}
          subtitle="Active accounts"
          accentClass="bg-blue-500"
          Icon={Users}
        />
        <StatCard
          label="Branches"
          value={stats.branchCount}
          subtitle="HQ + others"
          accentClass="bg-violet-500"
          Icon={Building2}
        />
        <StatCard
          label="Departments"
          value={stats.departmentCount}
          subtitle="Across branches"
          accentClass="bg-teal-500"
          Icon={Network}
        />
        <StatCard
          label="Onboarding"
          value={stats.onboardingActive}
          subtitle="Active candidates"
          accentClass="bg-amber-500"
          Icon={UserPlus}
          onClick={() => openFilter("active")}
          isActive={filter === "active"}
        />
      </div>

      {filter !== null && (
        <div ref={panelRef}>
          <OnboardingCandidatesPanel
            rows={candidates}
            filter={filter}
            onClose={() => setFilter(null)}
          />
        </div>
      )}
    </div>
  );
}

// ─── Stat Card ───
function StatCard({
  label,
  value,
  subtitle,
  accentClass,
  Icon,
  onClick,
  isActive = false,
}: {
  label: string;
  value: number;
  subtitle: string;
  accentClass: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  onClick?: () => void;
  isActive?: boolean;
}) {
  const isClickable = typeof onClick === "function";

  const body = (
    <>
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${accentClass}`} aria-hidden="true" />
      <Icon
        className="absolute top-3 right-3 w-10 h-10 text-slate-200 pointer-events-none"
        aria-hidden="true"
      />
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900 tabular-nums leading-none">{value}</p>
      <p className="mt-1.5 text-[11px] text-slate-500">{subtitle}</p>
    </>
  );

  const baseClasses =
    "relative bg-white border rounded-2xl p-4 overflow-hidden transition";
  const stateClasses = isClickable
    ? `cursor-pointer hover:border-slate-300 hover:shadow-md text-left w-full ${
        isActive ? "border-slate-400 shadow-md ring-2 ring-slate-200" : "border-slate-200"
      }`
    : "border-slate-200";

  if (isClickable) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={isActive}
        className={`${baseClasses} ${stateClasses}`}
      >
        {body}
      </button>
    );
  }

  return <div className={`${baseClasses} ${stateClasses}`}>{body}</div>;
}

// ─── Onboarding Candidates Panel ───

const TYPE_AVATAR_STYLES: Record<EmployeeTypeKey, string> = {
  "regular-intern": "bg-blue-100 text-blue-700",
  "protege-intern": "bg-violet-100 text-violet-700",
  "coach-part": "bg-amber-100 text-amber-700",
  "coach-full": "bg-emerald-100 text-emerald-700",
  "fulltime-hq": "bg-rose-100 text-rose-700",
};

function OnboardingCandidatesPanel({
  rows,
  filter,
  onClose,
}: {
  rows: CandidatePanelRow[];
  filter: "active" | "completed";
  onClose: () => void;
}) {
  const filtered = rows
    .filter((r) => {
      const s = r.status.toLowerCase();
      if (filter === "completed") return s === "completed";
      // "active" = sent, created, or in progress
      return s === "sent" || s === "created" || s === "in progress";
    })
    .slice(0, 50);

  return (
    <section
      aria-labelledby="onboarding-panel-heading"
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
    >
      <header className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="onboarding-panel-heading" className="text-sm font-semibold text-slate-900">
            Onboarding
            {filter === "completed" && (
              <span className="ml-2 text-[10px] uppercase tracking-wider font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5 align-middle">
                Completed
              </span>
            )}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {filter === "completed"
              ? "Candidates who have finished induction and need a role assigned."
              : "Candidates currently in the onboarding pipeline."}
            {filtered.length > 0 && (
              <> · Showing {filtered.length} of {filtered.length === 50 ? "50+" : filtered.length}.</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/induction/onboarding-dashboard?type=onboarding"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            View all →
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Hide onboarding panel"
            className="text-slate-400 hover:text-slate-700 text-lg leading-none px-1"
          >
            ×
          </button>
        </div>
      </header>

      {filtered.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-slate-500 italic">
          {filter === "completed"
            ? "No completed candidates waiting for role assignment."
            : "No candidates currently in the onboarding pipeline."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-5 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Department</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Branch</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((r) => {
                const empType = typeForWorkflowTemplate(r.workflowTemplate);
                const avatarStyle = TYPE_AVATAR_STYLES[empType.key];
                return (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => {
                      window.location.href = `/induction/onboarding-dashboard/${r.id}`;
                    }}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full font-semibold text-xs flex items-center justify-center shrink-0 ${avatarStyle}`}
                          aria-hidden="true"
                        >
                          {initialsFromName(r.employeeName)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{r.employeeName}</p>
                          <p className="text-xs text-slate-500 truncate">{r.employeeEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-700">
                      {/* A7: display "Intern" for the regular-intern type on this
                          page only — the shared induction-task-spec label is left
                          untouched so other modules are unaffected. */}
                      {empType.key === "regular-intern" ? "Intern" : empType.label}
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-700">{r.departmentName ?? "—"}</td>
                    <td className="px-3 py-3 text-xs font-mono text-slate-700">{r.branchCode ?? "—"}</td>
                    <td className="px-3 py-3">
                      <StatusPill status={r.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function StatusPill({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === "completed") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-blue-700">
        <span className="w-2 h-2 rounded-full bg-blue-500" aria-hidden="true" />
        Completed
      </span>
    );
  }
  if (s === "in progress") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700">
        <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-amber-700">
      <span className="w-2 h-2 rounded-full bg-amber-500" aria-hidden="true" />
      Sent
    </span>
  );
}
