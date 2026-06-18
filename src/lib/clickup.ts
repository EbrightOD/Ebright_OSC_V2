const CLICKUP_API_BASE = "https://api.clickup.com/api/v2";

export interface ClickUpTaskView {
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

export interface IndividualTasks {
  name: string;
  email: string;
  linked: boolean;
  tasks: ClickUpTaskView[];
}

export interface TargetUser {
  name: string;
  email: string;
  linked: boolean;
}

// ---- Pure helpers (unit-tested) ----

interface RawTask {
  id: string;
  name: string;
  status?: { status?: string; color?: string } | null;
  due_date?: string | null;
  priority?: { priority?: string } | null;
  list?: { name?: string } | null;
  url?: string;
  assignees?: { email?: string }[] | null;
}

export function mapTask(raw: RawTask): ClickUpTaskView {
  return {
    id: raw.id,
    name: raw.name,
    status: raw.status?.status ?? "",
    statusColor: raw.status?.color ?? "",
    dueDate: raw.due_date ? Number(raw.due_date) : null,
    priority: raw.priority?.priority ?? null,
    listName: raw.list?.name ?? "",
    url: raw.url ?? "",
    assigneeEmails: (raw.assignees ?? [])
      .map((a) => (a.email ?? "").toLowerCase())
      .filter(Boolean),
  };
}

export function sortByDueDate(tasks: ClickUpTaskView[]): ClickUpTaskView[] {
  return [...tasks].sort((a, b) => {
    if (a.dueDate === null && b.dueDate === null) return 0;
    if (a.dueDate === null) return 1;
    if (b.dueDate === null) return -1;
    return a.dueDate - b.dueDate;
  });
}

export function buildIndividuals(
  targets: TargetUser[],
  tasks: ClickUpTaskView[],
  viewerEmail: string,
): IndividualTasks[] {
  const viewer = viewerEmail.toLowerCase();
  const individuals = targets.map((t) => {
    const email = t.email.toLowerCase();
    const own = t.linked
      ? tasks.filter((task) => task.assigneeEmails.includes(email))
      : [];
    return { name: t.name, email, linked: t.linked, tasks: sortByDueDate(own) };
  });
  return individuals.sort((a, b) => {
    if (a.email === viewer) return -1;
    if (b.email === viewer) return 1;
    return a.name.localeCompare(b.name);
  });
}

// ---- Fetch helpers (manually verified) ----

async function clickupGet<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${CLICKUP_API_BASE}${path}`, {
    headers: { Authorization: token },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`ClickUp GET ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

export async function getWorkspaceMembers(
  teamId: string,
  token: string,
): Promise<{ id: string; email: string }[]> {
  const data = await clickupGet<{
    teams: { id: string; members: { user: { id: number; email: string } }[] }[];
  }>("/team", token);
  const team = data.teams.find((t) => t.id === teamId);
  if (!team) return [];
  return team.members.map((m) => ({
    id: String(m.user.id),
    email: (m.user.email ?? "").toLowerCase(),
  }));
}

export async function getOpenTasksByAssignees(
  teamId: string,
  clickupUserIds: string[],
  token: string,
): Promise<ClickUpTaskView[]> {
  if (clickupUserIds.length === 0) return [];
  const params = new URLSearchParams({
    include_closed: "false",
    subtasks: "true",
    order_by: "due_date",
  });
  for (const id of clickupUserIds) params.append("assignees[]", id);
  const data = await clickupGet<{ tasks: RawTask[] }>(
    `/team/${teamId}/task?${params.toString()}`,
    token,
  );
  return data.tasks.map(mapTask);
}
