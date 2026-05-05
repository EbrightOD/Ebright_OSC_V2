import Link from "next/link";
import { ChevronRight, Home, UserPlus } from "lucide-react";
import CreateInductionForm from "./CreateInductionForm";
import InductionRowActions from "./InductionRowActions";
import { RequestList } from "./RequestList";
import type {
  InductionEmployeeOption,
  PendingInductionRequestRow,
  PendingInductionRow,
} from "@/app/induction/queries";

interface InductionControlCentreProps {
  employees: InductionEmployeeOption[];
  profiles: PendingInductionRow[];
  requests: PendingInductionRequestRow[];
}

const STATUS_PILL: Record<string, string> = {
  Created: "bg-blue-100 text-blue-700",
  Sent: "bg-indigo-100 text-indigo-700",
  "In Progress": "bg-amber-100 text-amber-800",
  Completed: "bg-emerald-100 text-emerald-700",
};

export default function InductionControlCentre({
  employees,
  profiles,
  requests,
}: InductionControlCentreProps) {
  const pendingCount = profiles.filter(
    (p) => p.status === "Created" || p.status === "Sent" || p.status === "In Progress",
  ).length;

  return (
    <div className="min-h-full bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 pt-4 pb-10">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/home" className="flex items-center gap-1 hover:text-slate-900 transition-colors">
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>Home</span>
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <Link href="/dashboards/hrms" className="hover:text-slate-900 transition-colors">
            HRMS
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <span className="text-slate-900 font-medium">Induction Control Centre</span>
        </nav>

        <header className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 tracking-tight flex items-center gap-3">
              <span className="inline-flex w-10 h-10 rounded-xl bg-sky-600 items-center justify-center">
                <UserPlus className="w-5 h-5 text-white" aria-hidden="true" />
              </span>
              Induction Control Centre
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Generate token-locked onboarding and offboarding links, assign buddies, and track progress.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-sm font-semibold text-white">
              {pendingCount}
              <span className="text-xs font-normal text-blue-100">pending</span>
            </span>
            <CreateInductionForm employees={employees} />
          </div>
        </header>

        <RequestList requests={requests} />

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">Induction Profiles</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              All profiles created for onboarding or offboarding, newest first.
            </p>
          </div>

          {profiles.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm text-slate-500">
                No induction profiles yet. Click <span className="font-medium text-slate-700">Create Induction Profile</span> to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left font-medium">Employee</th>
                    <th scope="col" className="px-6 py-3 text-left font-medium">Type</th>
                    <th scope="col" className="px-6 py-3 text-left font-medium">Template</th>
                    <th scope="col" className="px-6 py-3 text-left font-medium">Start</th>
                    <th scope="col" className="px-6 py-3 text-left font-medium">Buddy</th>
                    <th scope="col" className="px-6 py-3 text-left font-medium">Progress</th>
                    <th scope="col" className="px-6 py-3 text-left font-medium">Status</th>
                    <th scope="col" className="px-6 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {profiles.map((row) => {
                    const pct =
                      row.totalSteps > 0
                        ? Math.round((row.completedSteps / row.totalSteps) * 100)
                        : 0;
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/60">
                        <td className="px-6 py-3">
                          <div className="font-medium text-slate-900">{row.employeeName}</div>
                          <div className="text-xs text-slate-500">{row.employeeEmail}</div>
                        </td>
                        <td className="px-6 py-3 text-slate-700">{row.inductionType}</td>
                        <td className="px-6 py-3 text-slate-700">{row.workflowTemplate}</td>
                        <td className="px-6 py-3 text-slate-700">{row.startDate}</td>
                        <td className="px-6 py-3 text-slate-700">{row.buddyName ?? "—"}</td>
                        <td className="px-6 py-3 min-w-[140px]">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-500 tabular-nums">
                              {row.completedSteps}/{row.totalSteps}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              STATUS_PILL[row.status] ?? "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <InductionRowActions
                            inductionProfileId={row.id}
                            linkToken={row.linkToken}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
