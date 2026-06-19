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

export interface StatusSlice {
  status: string;
  color: string;
  count: number;
}

export interface BranchRef {
  name: string;
  code: string | null;
}

/**
 * Find which branches a task's text mentions: branch name as a substring (names
 * longer than 3 chars), or branch code as a standalone token (e.g. "HQ", "KLG").
 * A task can mention several branches. NOTE: this is title/folder text matching,
 * not a structured branch field — ClickUp has none.
 */
export function matchBranches(text: string, branches: BranchRef[]): string[] {
  const lower = (text || "").toLowerCase();
  const tokens = new Set(lower.split(/[^a-z0-9]+/).filter(Boolean));
  const out: string[] = [];
  for (const b of branches) {
    const nameHit = b.name.length > 3 && lower.includes(b.name.toLowerCase());
    const codeHit = !!b.code && b.code.length >= 2 && tokens.has(b.code.toLowerCase());
    if (nameHit || codeHit) out.push(b.name);
  }
  return out;
}

/** Count tasks by status (for a pie chart), using each status's ClickUp color. */
export function aggregateByStatus(tasks: ClickUpTaskView[]): StatusSlice[] {
  const map = new Map<string, StatusSlice>();
  for (const t of tasks) {
    const status = t.status || "no status";
    const existing = map.get(status);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(status, { status, color: t.statusColor || "#94a3b8", count: 1 });
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
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
 * Fetch every open task in the workspace, across all pages. ClickUp paginates the
 * filtered team-tasks endpoint at 100 tasks/page and reports `last_page`; we loop
 * until it's true (or a page is empty). A MAX_PAGES guard bounds runaway loops.
 */
async function fetchAllOpenTasks(teamId: string, token: string): Promise<ClickUpTaskView[]> {
  const MAX_PAGES = 50; // 5000 tasks — a safety bound, not an expected limit
  const all: ClickUpTaskView[] = [];

  for (let page = 0; page < MAX_PAGES; page++) {
    const params = new URLSearchParams({
      include_closed: "false",
      subtasks: "true",
      order_by: "due_date",
      page: String(page),
    });
    const res = await fetch(`${CLICKUP_API_BASE}/team/${teamId}/task?${params.toString()}`, {
      headers: { Authorization: token },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`ClickUp tasks fetch failed: ${res.status}`);
    const data = (await res.json()) as { tasks: RawTask[]; last_page?: boolean };
    all.push(...data.tasks.map(mapTask));
    if (data.last_page || data.tasks.length === 0) break;
  }

  return all;
}

// In-memory cache shared across requests in the long-lived Node server. The
// workspace has thousands of open tasks, so fetching ~50 pages on every dashboard
// load would be far too slow; instead we fetch once and serve cached results for
// CACHE_TTL_MS. The first request after a cold start (or cache expiry) pays the
// full fetch; subsequent loads are instant. Keyed by teamId.
const CACHE_TTL_MS = 10 * 60 * 1000;
type TaskCache = { at: number; tasks: ClickUpTaskView[]; inFlight: Promise<ClickUpTaskView[]> | null };
const taskCacheByTeam = new Map<string, TaskCache>();

/**
 * All open tasks in the workspace, served from a 10-minute in-memory cache.
 * Concurrent callers during a refresh share one in-flight fetch (no thundering
 * herd). On a refresh failure, the last good cache is returned if available.
 */
export async function getOpenTasks(teamId: string, token: string): Promise<ClickUpTaskView[]> {
  const now = Date.now();
  let entry = taskCacheByTeam.get(teamId);
  if (!entry) {
    entry = { at: 0, tasks: [], inFlight: null };
    taskCacheByTeam.set(teamId, entry);
  }

  const fresh = entry.at > 0 && now - entry.at < CACHE_TTL_MS;
  if (fresh) return entry.tasks;

  // Coalesce concurrent refreshes into a single fetch.
  let refresh = entry.inFlight;
  if (!refresh) {
    const current = entry;
    refresh = fetchAllOpenTasks(teamId, token)
      .then((tasks) => {
        current.tasks = tasks;
        current.at = Date.now();
        return tasks;
      })
      .finally(() => {
        current.inFlight = null;
      });
    current.inFlight = refresh;
  }

  try {
    return await refresh;
  } catch (err) {
    if (entry.at > 0) return entry.tasks; // serve stale on refresh failure
    throw err;
  }
}
