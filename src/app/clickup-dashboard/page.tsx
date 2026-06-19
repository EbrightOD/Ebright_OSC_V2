"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import AppShell from "@/app/components/AppShell";

interface Branch { id: string; code: string; name: string; dashboardUrl: string | null }

type Payload = { configured: false } | { configured: true; branches: Branch[] };

type State =
  | { kind: "loading" }
  | { kind: "forbidden" }
  | { kind: "notConfigured" }
  | { kind: "error" }
  | { kind: "ready"; branches: Branch[] };

export default function ClickUpDashboardPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() { redirect("/login"); },
  });
  const [state, setState] = useState<State>({ kind: "loading" });

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/clickup/branches", { cache: "no-store" });
      if (res.status === 403) return setState({ kind: "forbidden" });
      if (!res.ok) return setState({ kind: "error" });
      const data: Payload = await res.json();
      if (!data.configured) return setState({ kind: "notConfigured" });
      setState({ kind: "ready", branches: data.branches });
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
        <div className="max-w-4xl mx-auto px-6 py-10">
          <header className="mb-8">
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">ClickUp Dashboards</h1>
            <p className="mt-1 text-sm text-slate-500">Branch task dashboards, imported from ClickUp</p>
          </header>

          {state.kind === "loading" && (
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="px-5 py-4"><div className="h-4 w-64 bg-slate-100 rounded animate-pulse" /></div>
              ))}
            </div>
          )}

          {state.kind === "forbidden" && <p className="text-slate-500">This page is restricted to superadmin accounts.</p>}
          {state.kind === "notConfigured" && <p className="text-slate-500">ClickUp is not configured yet.</p>}
          {state.kind === "error" && (
            <div>
              <p className="text-red-600 mb-3">Couldn&apos;t load branches.</p>
              <button onClick={load} className="px-4 py-2 rounded-md bg-slate-100 text-slate-700 text-sm hover:bg-slate-200 cursor-pointer transition-colors">Retry</button>
            </div>
          )}

          {state.kind === "ready" && (
            <>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
                {state.branches.map((b) => {
                  const inner = (
                    <>
                      <span className="inline-flex items-center justify-center w-12 shrink-0 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-md py-1">
                        {b.code}
                      </span>
                      <span className="flex-1 text-sm font-medium text-slate-800 group-hover:text-indigo-600 truncate">
                        Ebright | {b.code} | {b.name}
                      </span>
                      {b.dashboardUrl ? (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400 group-hover:text-indigo-500 shrink-0">
                          Open in ClickUp
                          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path d="M11 3a1 1 0 1 0 0 2h2.586l-6.293 6.293a1 1 0 1 0 1.414 1.414L15 6.414V9a1 1 0 1 0 2 0V4a1 1 0 0 0-1-1h-5Z" />
                            <path d="M5 5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3a1 1 0 1 0-2 0v3H5V7h3a1 1 0 0 0 0-2H5Z" />
                          </svg>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300 shrink-0">link not set</span>
                      )}
                    </>
                  );
                  return b.dashboardUrl ? (
                    <a
                      key={b.id}
                      href={b.dashboardUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      {inner}
                    </a>
                  ) : (
                    <div key={b.id} className="flex items-center gap-3 px-5 py-4 opacity-60">
                      {inner}
                    </div>
                  );
                })}
                {state.branches.length === 0 && <p className="px-5 py-6 text-sm text-slate-500">No branch dashboards found.</p>}
              </div>
              <p className="mt-4 text-xs text-slate-400">
                Dashboards open in ClickUp (they can&apos;t be embedded). Branches marked &ldquo;link not set&rdquo;
                need their ClickUp dashboard URL added to the config.
              </p>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
