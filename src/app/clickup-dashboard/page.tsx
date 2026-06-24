"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
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
          <header className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">ClickUp Dashboards</h1>
              <p className="mt-1 text-sm text-slate-500">Branch task dashboards, imported from ClickUp</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/clickup-dashboard/views"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white text-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-50 cursor-pointer transition-colors"
              >
                Embedded views
              </Link>
              <Link
                href="/clickup-dashboard/operations"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 cursor-pointer transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M15.5 2A1.5 1.5 0 0 1 17 3.5v13a1.5 1.5 0 0 1-1.5 1.5h-1A1.5 1.5 0 0 1 13 16.5v-13A1.5 1.5 0 0 1 14.5 2h1ZM9.5 8A1.5 1.5 0 0 1 11 9.5v7A1.5 1.5 0 0 1 9.5 18h-1A1.5 1.5 0 0 1 7 16.5v-7A1.5 1.5 0 0 1 8.5 8h1ZM3.5 12A1.5 1.5 0 0 1 5 13.5v3A1.5 1.5 0 0 1 3.5 18h-1A1.5 1.5 0 0 1 1 16.5v-3A1.5 1.5 0 0 1 2.5 12h1Z" />
                </svg>
                Operations by day
              </Link>
            </div>
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
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
              {state.branches.map((b) => (
                <div key={b.id} className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors">
                  <Link href={`/clickup-dashboard/${b.id}`} className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer group">
                    <span className="inline-flex items-center justify-center w-12 shrink-0 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-md py-1">
                      {b.code}
                    </span>
                    <span className="text-sm font-medium text-slate-800 group-hover:text-indigo-600 truncate">
                      Ebright | {b.code} | {b.name}
                    </span>
                  </Link>
                  {b.dashboardUrl ? (
                    <a
                      href={b.dashboardUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-indigo-600 cursor-pointer"
                      title="Open this branch's dashboard in ClickUp"
                    >
                      Open in ClickUp
                      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path d="M11 3a1 1 0 1 0 0 2h2.586l-6.293 6.293a1 1 0 1 0 1.414 1.414L15 6.414V9a1 1 0 1 0 2 0V4a1 1 0 0 0-1-1h-5Z" />
                        <path d="M5 5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3a1 1 0 1 0-2 0v3H5V7h3a1 1 0 0 0 0-2H5Z" />
                      </svg>
                    </a>
                  ) : (
                    <span className="shrink-0 text-xs text-slate-300">link not set</span>
                  )}
                </div>
              ))}
              {state.branches.length === 0 && <p className="px-5 py-6 text-sm text-slate-500">No branch dashboards found.</p>}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
