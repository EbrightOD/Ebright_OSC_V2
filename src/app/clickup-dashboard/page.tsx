"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import AppShell from "@/app/components/AppShell";
import PieChart from "@/app/components/PieChart";

interface StatusSlice { status: string; color: string; count: number }
interface DepartmentBreakdown { departmentName: string; total: number; statusBreakdown: StatusSlice[] }

type Payload =
  | { configured: false }
  | {
      configured: true;
      totalTaskCount: number;
      overall: StatusSlice[];
      departments: DepartmentBreakdown[];
    };

type State =
  | { kind: "loading" }
  | { kind: "forbidden" }
  | { kind: "notConfigured" }
  | { kind: "error" }
  | { kind: "ready"; data: Extract<Payload, { configured: true }> };

function toSlices(statuses: StatusSlice[]) {
  return statuses.map((s) => ({ label: s.status, value: s.count, color: s.color }));
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
      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold text-slate-900 mb-1">ClickUp Monitoring</h1>
        <p className="text-sm text-slate-500 mb-8">Open tasks by status, imported from ClickUp.</p>

        {state.kind === "loading" && (
          <div className="space-y-4">
            <div className="h-48 bg-slate-100 rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[0, 1, 2, 3].map((i) => <div key={i} className="h-40 bg-slate-100 rounded animate-pulse" />)}
            </div>
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
            <button onClick={load} className="px-4 py-2 rounded-md bg-slate-100 text-slate-700 text-sm hover:bg-slate-200">
              Retry
            </button>
          </div>
        )}

        {state.kind === "ready" && (
          <>
            <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-8">
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-base font-semibold text-slate-900">All tasks by status</h2>
                <span className="text-xs text-slate-400">{state.data.totalTaskCount} total</span>
              </div>
              <PieChart data={toSlices(state.data.overall)} size={180} />
            </section>

            <h2 className="text-lg font-semibold text-slate-800 mb-4">By department</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {state.data.departments.map((dept) => (
                <section key={dept.departmentName} className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
                  <div className="flex items-baseline justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-900">{dept.departmentName}</h3>
                    <span className="text-xs text-slate-400">{dept.total} tasks</span>
                  </div>
                  <PieChart data={toSlices(dept.statusBreakdown)} size={130} />
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
