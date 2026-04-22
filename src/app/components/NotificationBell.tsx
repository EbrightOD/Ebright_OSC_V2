"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell, Hourglass, X } from "lucide-react";

export default function NotificationBell({ role }: { role?: string }) {
  const isSuperadmin = role === "superadmin";
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSuperadmin) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/approvals/count", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { count?: number };
        if (!cancelled && typeof data.count === "number") setCount(data.count);
      } catch {
        // network flake — no-op
      }
    };
    load();
    const interval = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isSuperadmin]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={count > 0 ? `Notifications: ${count} pending` : "Notifications"}
        className={`relative inline-flex items-center justify-center w-10 h-10 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
          open ? "bg-slate-100" : "hover:bg-slate-100"
        }`}
        style={{ color: "#1e293b" }}
      >
        <span className="relative inline-flex">
          <Bell className="w-6 h-6" fill="currentColor" strokeWidth={1.5} aria-hidden="true" />
          {count > 0 && (
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                top: "-6px",
                right: "-6px",
                minWidth: "18px",
                height: "18px",
                padding: "0 5px",
                borderRadius: "9999px",
                backgroundColor: "#dc2626",
                color: "#ffffff",
                fontSize: "10px",
                fontWeight: 700,
                lineHeight: 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 0 2px #ffffff",
                pointerEvents: "none",
              }}
            >
              {count > 99 ? "99+" : count}
            </span>
          )}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-[22rem] bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden"
        >
          {!isSuperadmin || count === 0 ? (
            <>
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close notifications"
                  className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
              <div className="px-5 py-10 text-center">
                <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-slate-400" aria-hidden="true" />
                </div>
                <p className="mt-3 text-sm font-medium text-slate-900">You&apos;re all caught up</p>
                <p className="mt-0.5 text-xs text-slate-500">New notifications will show up here.</p>
              </div>
            </>
          ) : (
            <div className="p-4">
              <div className="flex items-start gap-3">
                <span className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0 ring-1 ring-inset ring-amber-200">
                  <Hourglass className="w-5 h-5 text-amber-600" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900 leading-snug">Account approval</p>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      aria-label="Dismiss"
                      className="shrink-0 -mt-0.5 -mr-1 p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500 leading-snug">
                    {count === 1
                      ? "1 registration is waiting for your approval."
                      : `${count} registrations are waiting for your approval.`}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <Link
                      href="/approvals"
                      onClick={() => setOpen(false)}
                      className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 shadow-sm"
                    >
                      Review
                    </Link>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="inline-flex items-center justify-center h-9 px-4 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
