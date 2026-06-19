import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import {
  getBranchSpaces,
  getSpaceOpenTasks,
  aggregateByStatus,
  scheduleSection,
  sectionSortKey,
  type ClickUpTaskView,
  type StatusSlice,
} from "@/lib/clickup";

export const dynamic = "force-dynamic";

/** Run async fn over items with bounded concurrency (avoids ClickUp rate-limit bursts). */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const idx = cursor++;
      results[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

interface DayBreakdown { total: number; statusBreakdown: StatusSlice[] }

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (role !== "superadmin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const token = process.env.CLICKUP_API_TOKEN;
  const teamId = process.env.CLICKUP_TEAM_ID;
  if (!token || !teamId) return NextResponse.json({ configured: false });

  try {
    const branchSpaces = await getBranchSpaces(teamId, token);

    const perBranch = await mapLimit(branchSpaces, 3, async (b) => {
      let tasks: ClickUpTaskView[] | null;
      try {
        tasks = await getSpaceOpenTasks(teamId, b.id, token);
      } catch {
        tasks = null;
      }
      return { branch: b, tasks };
    });

    const sectionSet = new Set<string>();
    let loadedBranches = 0;

    const branches = perBranch.map(({ branch, tasks }) => {
      const byDay: Record<string, DayBreakdown> = {};
      if (tasks) {
        loadedBranches++;
        const grouped = new Map<string, ClickUpTaskView[]>();
        for (const task of tasks) {
          const label = scheduleSection(task.folderName);
          // Keep weekdays + recognized periods; collapse the rest into "Other".
          const key = sectionSortKey(label)[0] === 3 ? "Other" : label;
          const list = grouped.get(key) ?? [];
          list.push(task);
          grouped.set(key, list);
        }
        for (const [label, list] of grouped) {
          byDay[label] = { total: list.length, statusBreakdown: aggregateByStatus(list) };
          sectionSet.add(label);
        }
      }
      return { id: branch.id, code: branch.code, name: branch.name, byDay };
    });

    const sections = [...sectionSet].sort((a, b) => {
      const ra = sectionSortKey(a);
      const rb = sectionSortKey(b);
      for (let i = 0; i < 3; i++) {
        if (ra[i] < rb[i]) return -1;
        if (ra[i] > rb[i]) return 1;
      }
      return 0;
    });

    return NextResponse.json({
      configured: true,
      branchCount: branchSpaces.length,
      loadedBranches,
      sections,
      branches,
    });
  } catch {
    return NextResponse.json({ error: "Failed to load operations dashboard" }, { status: 502 });
  }
}
