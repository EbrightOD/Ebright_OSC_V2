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

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (role !== "superadmin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const token = process.env.CLICKUP_API_TOKEN;
  const teamId = process.env.CLICKUP_TEAM_ID;
  if (!token || !teamId) return NextResponse.json({ configured: false });

  try {
    const branches = await getBranchSpaces(teamId, token);

    // Fetch each branch's tasks (cached per space). Bounded concurrency + per-branch
    // try/catch so one failing/rate-limited branch degrades gracefully.
    const perBranch = await mapLimit(branches, 3, async (b) => {
      try {
        return await getSpaceOpenTasks(teamId, b.id, token);
      } catch {
        return null;
      }
    });
    const loaded = perBranch.filter((t): t is ClickUpTaskView[] => t !== null);
    const tasks = loaded.flat();

    // Aggregate every branch's tasks by weekday / period section. Folders that
    // are neither a weekday nor a recognized period (per-coach lists, "hidden",
    // ad-hoc) collapse into a single "Other" card so the by-day view stays clean.
    const bySection = new Map<string, ClickUpTaskView[]>();
    for (const task of tasks) {
      const label = scheduleSection(task.folderName);
      const key = sectionSortKey(label)[0] === 3 ? "Other" : label;
      const list = bySection.get(key) ?? [];
      list.push(task);
      bySection.set(key, list);
    }

    const sections = [...bySection.entries()]
      .map(([name, sectionTasks]) => ({
        name,
        total: sectionTasks.length,
        statusBreakdown: aggregateByStatus(sectionTasks),
      }))
      .sort((a, b) => {
        const ra = sectionSortKey(a.name);
        const rb = sectionSortKey(b.name);
        for (let i = 0; i < 3; i++) {
          if (ra[i] < rb[i]) return -1;
          if (ra[i] > rb[i]) return 1;
        }
        return 0;
      });

    return NextResponse.json({
      configured: true,
      branchCount: branches.length,
      loadedBranches: loaded.length,
      totalTaskCount: tasks.length,
      sections,
    });
  } catch {
    return NextResponse.json({ error: "Failed to load operations dashboard" }, { status: 502 });
  }
}
