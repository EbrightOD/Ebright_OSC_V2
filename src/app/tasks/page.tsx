"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import AppShell from "@/app/components/AppShell";

interface TaskView {
  id: string;
  name: string;
  status: string;
  statusColor: string;
  dueDate: number | null;
  priority: string | null;
  listName: string;
  url: string;
  assigneeEmails: string[];
}
interface IndividualTasks { name: string; email: string; linked: boolean; tasks: TaskView[] }
interface DepartmentGroup { departmentName: string; individuals: IndividualTasks[] }

type Payload =
  | { configured: false }
  | { configured: true; scope: "own" | "department"; viewerEmail: string; departments: DepartmentGroup[] };

type State =
  | { kind: "loading" }
  | { kind: "notConfigured" }
  | { kind: "error" }
  | { kind: "ready"; data: Extract<Payload, { configured: true }> };

function formatDue(due: number | null): { label: string; overdue: boolean } {
  if (due === null) return { label: "No due date", overdue: false };
  const d = new Date(due);
  return {
    label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    overdue: due < Date.now(),
  };
}

export default function TasksPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() { redirect("/login"); },
  });
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
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold text-slate-900 mb-8">Ongoing Tasks</h1>

        {state.kind === "loading" && (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-16 bg-slate-100 rounded animate-pulse" />)}
          </div>
        )}

        {state.kind === "notConfigured" && (
          <p className="text-slate-500">ClickUp is not configured yet.</p>
        )}

        {state.kind === "error" && (
          <div>
            <p className="text-red-600 mb-3">Couldn&apos;t load tasks.</p>
            <button onClick={load} className="px-4 py-2 rounded-md bg-slate-100 text-slate-700 text-sm hover:bg-slate-200">
              Retry
            </button>
          </div>
        )}

        {state.kind === "ready" && state.data.departments.map((dept) => (
          <section key={dept.departmentName} className="mb-10">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">{dept.departmentName}</h2>
            <div className="space-y-6">
              {dept.individuals.map((person) => (
                <div key={person.email} className="bg-white rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-slate-900">
                      {person.name}
                      {person.email === state.data.viewerEmail && (
                        <span className="ml-2 text-xs font-normal text-indigo-500">(you)</span>
                      )}
                    </h3>
                    {!person.linked && <span className="text-xs text-slate-400">not linked to ClickUp</span>}
                  </div>
                  {person.tasks.length === 0 ? (
                    <p className="text-sm text-slate-400">No open tasks.</p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {person.tasks.map((task) => {
                        const due = formatDue(task.dueDate);
                        return (
                          <li key={task.id} className="py-2">
                            <a href={task.url} target="_blank" rel="noopener noreferrer" className="group block">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-sm text-slate-800 group-hover:text-indigo-600 truncate">{task.name}</span>
                                <span className={`text-xs whitespace-nowrap ${due.overdue ? "text-red-600 font-medium" : "text-slate-400"}`}>
                                  {due.label}
                                </span>
                              </div>
                              <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                                <span className="inline-block px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: task.statusColor || "#94a3b8" }}>
                                  {task.status || "—"}
                                </span>
                                {task.priority && <span>· {task.priority}</span>}
                                {task.listName && <span className="truncate">· {task.listName}</span>}
                              </div>
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
