"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import AppShell from "@/app/components/AppShell";
import DonutChart from "@/app/components/DonutChart";

interface StatusSlice { status: string; color: string; count: number }
interface Section { name: string; total: number; statusBreakdown: StatusSlice[] }

type Payload =
  | { configured: false }
  | {
      configured: true;
      branchCount: number;
      loadedBranches: number;
      totalTaskCount: number;
      sections: Section[];
    };

type State =
  | { kind: "loading" }
  | { kind: "forbidden" }
  | { kind: "notConfigured" }
  | { kind: "error" }
  | { kind: "ready"; data: Extract<Payload, { configured: true }> };

function SectionCard({ section }: { section: Section }) {
  const segments = section.statusBreakdown.map((s) => ({ label: s.status, value: s.count, color: s.color }));
  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-slate-900">{section.name}</h2>
        <span className="text-xs font-medium text-slate-400 tabular-nums">{section.total} tasks</span>
      </div>
      <div className="flex items-center gap-6">
        <DonutChart data={segments} size={150} thickness={16} />
        <ul className="flex-1 min-w-0 space-y-1.5">
          {section.statusBreakdown.map((s) => (
            <li key={s.status} className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} aria-hidden="true" />
              <span className="text-slate-600 truncate capitalize">{s.status}</span>
              <span className="ml-auto tabular-nums text-slate-400 shrink-0">
                {s.count} · {Math.round((s.count / section.total) * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default function OperationsDashboardPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() { redirect("/login"); },
  });
  const [state, setState] = useState<State>({ kind: "loading" });

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/clickup/operations", { cache: "no-store" });
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
          <Link href="/clickup-dashboard" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600 mb-4 cursor-pointer transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z" clipRule="evenodd" />
            </svg>
            All branches
          </Link>

          <header className="mb-8">
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Branch Operations — by Day</h1>
            <p className="mt-1 text-sm text-slate-500">
              Overall task status per day, summed across all branches
              {state.kind === "ready" && (
                <>
                  {" "}· <span className="font-medium text-slate-700">{state.data.totalTaskCount.toLocaleString()}</span> tasks
                  {" "}from {state.data.loadedBranches}/{state.data.branchCount} branches
                </>
              )}
            </p>
          </header>

          {state.kind === "loading" && (
            <>
              <p className="text-sm text-slate-400 mb-4">Aggregating all branches… this can take a moment on first load.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 p-6">
                    <div className="h-4 w-28 bg-slate-100 rounded animate-pulse mb-5" />
                    <div className="flex items-center gap-6">
                      <div className="w-[150px] h-[150px] rounded-full bg-slate-100 animate-pulse shrink-0" />
                      <div className="flex-1 space-y-2">{[0, 1, 2].map((j) => <div key={j} className="h-3 bg-slate-100 rounded animate-pulse" />)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {state.kind === "forbidden" && <p className="text-slate-500">This page is restricted to superadmin accounts.</p>}
          {state.kind === "notConfigured" && <p className="text-slate-500">ClickUp is not configured yet.</p>}
          {state.kind === "error" && (
            <div>
              <p className="text-red-600 mb-3">Couldn&apos;t load the operations dashboard.</p>
              <button onClick={load} className="px-4 py-2 rounded-md bg-slate-100 text-slate-700 text-sm hover:bg-slate-200 cursor-pointer transition-colors">Retry</button>
            </div>
          )}

          {state.kind === "ready" && state.data.sections.length === 0 && <p className="text-slate-500">No branch tasks found.</p>}

          {state.kind === "ready" && state.data.sections.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {state.data.sections.map((s) => <SectionCard key={s.name} section={s} />)}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
