"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

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

function TaskRow({ task }: { task: TaskView }) {
  const due = formatDue(task.dueDate);
  return (
    <li className="py-2">
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
}

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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-slate-900">My ClickUp Tasks</h2>
        {state.kind === "ready" && state.data.scope === "department" && (
          <Link href="/tasks" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
            View department →
          </Link>
        )}
      </div>

      {state.kind === "loading" && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />)}
        </div>
      )}

      {state.kind === "notConfigured" && (
        <p className="text-sm text-slate-500 py-4 text-center">ClickUp is not configured yet.</p>
      )}

      {state.kind === "error" && (
        <div className="text-center py-6">
          <p className="text-sm text-red-600 mb-3">Couldn&apos;t load your tasks.</p>
          <button onClick={load} className="px-4 py-2 rounded-md bg-slate-100 text-slate-700 text-sm hover:bg-slate-200">
            Retry
          </button>
        </div>
      )}

      {state.kind === "ready" && (() => {
        const me = state.data.departments[0]?.individuals.find((i) => i.email === state.data.viewerEmail);
        const others = state.data.departments[0]?.individuals.filter((i) => i.email !== state.data.viewerEmail) ?? [];
        const otherTaskCount = others.reduce((n, i) => n + i.tasks.length, 0);
        return (
          <>
            {!me || me.tasks.length === 0 ? (
              <p className="text-sm text-slate-500 py-2">No open tasks assigned to you. 🎉</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {me.tasks.map((t) => <TaskRow key={t.id} task={t} />)}
              </ul>
            )}
            {state.data.scope === "department" && others.length > 0 && (
              <p className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                {otherTaskCount} open task{otherTaskCount !== 1 ? "s" : ""} across {others.length} teammate
                {others.length !== 1 ? "s" : ""} in {state.data.departments[0].departmentName}.{" "}
                <Link href="/tasks" className="text-indigo-600 hover:text-indigo-700">See all</Link>
              </p>
            )}
          </>
        );
      })()}
    </section>
  );
}
