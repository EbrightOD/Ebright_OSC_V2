"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import AppShell from "@/app/components/AppShell";
import { CLICKUP_EMBED_VIEWS } from "@/lib/clickup-embeds";

export default function ClickUpViewsPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() { redirect("/login"); },
  });

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

  if (userRole !== "superadmin") {
    return (
      <AppShell email={userEmail} role={userRole} name={userName}>
        <div className="max-w-7xl mx-auto px-6 py-10">
          <p className="text-slate-500">This page is restricted to superadmin accounts.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <div className="min-h-full bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <Link href="/clickup-dashboard" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600 mb-4 cursor-pointer transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z" clipRule="evenodd" />
            </svg>
            All dashboards
          </Link>

          <header className="mb-8">
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">ClickUp Views</h1>
            <p className="mt-1 text-sm text-slate-500">Live ClickUp views embedded from public share links</p>
          </header>

          {CLICKUP_EMBED_VIEWS.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-sm text-slate-500">
              <p className="mb-2">No embedded views configured yet.</p>
              <p className="text-slate-400">
                In ClickUp, open a view → <span className="font-medium text-slate-600">Share → Share publicly</span> → copy
                the public link, then add it to <code className="text-slate-600">src/lib/clickup-embeds.ts</code>. Private
                <code className="text-slate-600"> app.clickup.com</code> URLs won&apos;t embed (ClickUp blocks framing).
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {CLICKUP_EMBED_VIEWS.map((v) => (
                <section key={v.url} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                    <h2 className="text-sm font-semibold text-slate-900">{v.title}</h2>
                    <a href={v.url} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-400 hover:text-indigo-600 cursor-pointer">
                      Open in ClickUp ↗
                    </a>
                  </div>
                  <iframe
                    src={v.url}
                    title={v.title}
                    className="w-full block"
                    height={v.height ?? 800}
                    loading="lazy"
                  />
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
