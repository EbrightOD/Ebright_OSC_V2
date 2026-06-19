"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import AppShell from "@/app/components/AppShell";
import DonutChart from "@/app/components/DonutChart";

interface StatusSlice { status: string; color: string; count: number }
interface BranchBreakdown { branchName: string; total: number; statusBreakdown: StatusSlice[] }

type Payload =
  | { configured: false }
  | {
      configured: true;
      totalTaskCount: number;
      branchRelatedCount: number;
      branches: BranchBreakdown[];
    };

type State =
  | { kind: "loading" }
  | { kind: "forbidden" }
  | { kind: "notConfigured" }
  | { kind: "error" }
  | { kind: "ready"; data: Extract<Payload, { configured: true }> };

const LEGEND_LIMIT = 6;

function BranchCard({ branch }: { branch: BranchBreakdown }) {
  const segments = branch.statusBreakdown.map((s) => ({ label: s.status, value: s.count, color: s.color }));
  const shown = branch.statusBreakdown.slice(0, LEGEND_LIMIT);
  const hidden = branch.statusBreakdown.length - shown.length;

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900 truncate" title={branch.branchName}>
          {branch.branchName}
        </h3>
        <span className="text-xs font-medium text-slate-400 tabular-nums">{branch.total}</span>
      </div>

      <div className="flex items-center gap-5">
        <DonutChart data={segments} size={120} thickness={13} />
        <ul className="flex-1 min-w-0 space-y-1.5">
          {shown.map((s) => (
            <li key={s.status} className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} aria-hidden="true" />
              <span className="text-slate-600 truncate capitalize">{s.status}</span>
              <span className="ml-auto tabular-nums text-slate-400 shrink-0">
                {s.count} · {Math.round((s.count / branch.total) * 100)}%
              </span>
            </li>
          ))}
          {hidden > 0 && <li className="text-xs text-slate-400 pl-[18px]">+{hidden} more</li>}
        </ul>
      </div>
    </section>
  );
}

export default function ClickUpDashboardPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() { redirect("/login"); },
  });
  const [state, setState] = useState<State>({ kind: "loading" });

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/clickup/dashboard", { cache: "no-store" });
      if (res.status === 403) return setState({ kind: "forbidden" });
      if (!res.ok) return setState({ kind: "error" });
      const data: Payload = await res.json();
      if (!data.configured) return setState({ kind: "notConfigured" });
      setState({ kind: "ready", data });
    } catch {
      setState({ kind: "error" });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-blue-600 font-semibold text-lg">
        Loading…
      </div>
    );
  }

  const userEmail = session?.user?.email || "";
  const userRole = (session?.user as { role?: string } | undefined)?.role || "USER";
  const userName = session?.user?.name ?? null;

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <div className="min-h-full bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <header className="mb-8">
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">ClickUp — Branch Tasks</h1>
            <p className="mt-1 text-sm text-slate-500">
              Open tasks by status, grouped by branch
              {state.kind === "ready" && (
                <> · <span className="font-medium text-slate-700">{state.data.branchRelatedCount.toLocaleString()}</span> branch-related of {state.data.totalTaskCount.toLocaleString()} total</>
              )}
            </p>
          </header>

          {state.kind === "loading" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="h-4 w-24 bg-slate-100 rounded animate-pulse mb-4" />
                  <div className="flex items-center gap-5">
                    <div className="w-[120px] h-[120px] rounded-full bg-slate-100 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      {[0, 1, 2, 3].map((j) => <div key={j} className="h-3 bg-slate-100 rounded animate-pulse" />)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {state.kind === "forbidden" && (
            <p className="text-slate-500">This page is restricted to superadmin accounts.</p>
          )}

          {state.kind === "notConfigured" && (
            <p className="text-slate-500">ClickUp is not configured yet.</p>
          )}

          {state.kind === "error" && (
            <div>
              <p className="text-red-600 mb-3">Couldn&apos;t load the dashboard.</p>
              <button onClick={load} className="px-4 py-2 rounded-md bg-slate-100 text-slate-700 text-sm hover:bg-slate-200 cursor-pointer transition-colors">
                Retry
              </button>
            </div>
          )}

          {state.kind === "ready" && state.data.branches.length === 0 && (
            <p className="text-slate-500">No branch-related tasks found.</p>
          )}

          {state.kind === "ready" && state.data.branches.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {state.data.branches.map((branch) => <BranchCard key={branch.branchName} branch={branch} />)}
              </div>
              <p className="mt-6 text-xs text-slate-400">
                Branch is inferred from branch names/codes in the task title, list, or folder — ClickUp has no
                branch field, so a task that names several branches is counted under each.
              </p>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
