const CLICKUP_API_BASE = "https://api.clickup.com/api/v2";

export interface ClickUpTaskView {
  id: string;
  name: string;
  status: string;
  statusColor: string;
  dueDate: number | null;
  priority: string | null;
  listName: string;
  folderName: string;
  ownerName: string | null;
  url: string;
}

export interface IndividualTasks {
  userId: number;
  name: string;
  tasks: ClickUpTaskView[];
}

export interface OtherBucket {
  ownerName: string;
  tasks: ClickUpTaskView[];
}

/** A candidate app employee an extracted ClickUp owner name can be matched against. */
export interface RosterEntry {
  userId: number;
  fullName: string;
  nickName: string | null;
  departmentId: number | null;
}

// ---- Pure helpers (unit-tested) ----

interface RawTask {
  id: string;
  name: string;
  status?: { status?: string; color?: string } | null;
  due_date?: string | null;
  priority?: { priority?: string } | null;
  list?: { name?: string } | null;
  folder?: { name?: string } | null;
  url?: string;
}

/**
 * The task owner is written into the folder name in this workspace: as a
 * trailing parenthetical — "Database and HRMS (Rahman)" — or after an
 * "Intern - " prefix — "3.6.9 Intern - Yee Qian". Returns null when neither
 * pattern is present.
 */
export function extractOwner(folderName: string | null | undefined): string | null {
  const n = (folderName ?? "").trim();
  if (!n) return null;
  const paren = n.match(/\(([^()]+)\)\s*$/);
  if (paren) return paren[1].trim() || null;
  const intern = n.match(/Intern\s*-\s*(.+)$/i);
  if (intern) return intern[1].trim() || null;
  return null;
}

export function normalizeName(s: string | null | undefined): string {
  return (s ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Match an extracted ClickUp owner nickname to an app employee: exact match on
 * nick_name or full_name first, then a whole-word match within either. Returns
 * the matched user_id, or null. First match wins on first-name collisions (v1).
 */
export function matchOwnerToRoster(
  owner: string | null,
  roster: RosterEntry[],
): number | null {
  const o = normalizeName(owner);
  if (o.length < 2) return null;

  const exact = roster.find(
    (r) => normalizeName(r.nickName) === o || normalizeName(r.fullName) === o,
  );
  if (exact) return exact.userId;

  const word = roster.find(
    (r) =>
      normalizeName(r.fullName).split(" ").includes(o) ||
      normalizeName(r.nickName).split(" ").includes(o),
  );
  return word ? word.userId : null;
}

export function sortByDueDate(tasks: ClickUpTaskView[]): ClickUpTaskView[] {
  return [...tasks].sort((a, b) => {
    if (a.dueDate === null && b.dueDate === null) return 0;
    if (a.dueDate === null) return 1;
    if (b.dueDate === null) return -1;
    return a.dueDate - b.dueDate;
  });
}

export function mapTask(raw: RawTask): ClickUpTaskView {
  const folderName = raw.folder?.name ?? "";
  return {
    id: raw.id,
    name: raw.name,
    status: raw.status?.status ?? "",
    statusColor: raw.status?.color ?? "",
    dueDate: raw.due_date ? Number(raw.due_date) : null,
    priority: raw.priority?.priority ?? null,
    listName: raw.list?.name ?? "",
    folderName,
    ownerName: extractOwner(folderName),
    url: raw.url ?? "",
  };
}

// ---- Fetch helper (manually verified) ----

/**
 * All open tasks in the workspace. NOTE: ClickUp paginates at 100 tasks/page and
 * this fetches only the first page — tasks beyond 100 are not scanned. Pagination
 * is intentionally deferred; revisit if a workspace routinely exceeds 100 open
 * tasks (it already does in practice — known limitation).
 */
export async function getOpenTasks(teamId: string, token: string): Promise<ClickUpTaskView[]> {
  const params = new URLSearchParams({
    include_closed: "false",
    subtasks: "true",
    order_by: "due_date",
  });
  const res = await fetch(`${CLICKUP_API_BASE}/team/${teamId}/task?${params.toString()}`, {
    headers: { Authorization: token },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`ClickUp tasks fetch failed: ${res.status}`);
  const data = (await res.json()) as { tasks: RawTask[] };
  return data.tasks.map(mapTask);
}
