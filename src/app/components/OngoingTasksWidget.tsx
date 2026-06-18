"use client";

import { useCallback, useEffect, useState } from "react";
import PieChart from "@/app/components/PieChart";

interface StatusSlice { status: string; color: string; count: number }

type Payload =
  | { configured: false }
  | { configured: true; statusBreakdown: StatusSlice[]; totalTaskCount: number };

type State =
  | { kind: "loading" }
  | { kind: "notConfigured" }
  | { kind: "error" }
  | { kind: "ready"; data: Extract<Payload, { configured: true }> };

export default function OngoingTasksWidget() {
  const [state, setState] = useState<State>({ kind: "loading" });

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/clickup/tasks", { cache: "no-store" });
      if (!res.ok) return setState({ kind: "error" });
      const data: Payload = await res.json();
      if (!data.configured) return setState({ kind: "notConfigured" });
      setState({ kind: "ready", data });
    } catch {
      setState({ kind: "error" });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-base font-semibold text-slate-900">ClickUp Tasks by Status</h2>
        {state.kind === "ready" && (
          <span className="text-xs text-slate-400">{state.data.totalTaskCount} total</span>
        )}
      </div>

      {state.kind === "loading" && (
        <div className="h-40 bg-slate-100 rounded animate-pulse" />
      )}

      {state.kind === "notConfigured" && (
        <p className="text-sm text-slate-500 py-4 text-center">ClickUp is not configured yet.</p>
      )}

      {state.kind === "error" && (
        <div className="text-center py-6">
          <p className="text-sm text-red-600 mb-3">Couldn&apos;t load tasks.</p>
          <button onClick={load} className="px-4 py-2 rounded-md bg-slate-100 text-slate-700 text-sm hover:bg-slate-200">
            Retry
          </button>
        </div>
      )}

      {state.kind === "ready" && (
        <PieChart
          data={state.data.statusBreakdown.map((s) => ({
            label: s.status,
            value: s.count,
            color: s.color,
          }))}
        />
      )}
    </section>
  );
}
