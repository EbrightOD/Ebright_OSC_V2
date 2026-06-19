import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import {
  getBranchSpaces,
  getSpaceOpenTasks,
  aggregateByStatus,
  type ClickUpTaskView,
} from "@/lib/clickup";

export const dynamic = "force-dynamic";

const DAY: Record<string, number> = { mon: 1, tue: 2, wed: 3, thu: 4, thur: 4, fri: 5, sat: 6, sun: 7 };
const ROLE: Record<string, number> = { manager: 1, executive: 2, coach: 3 };

/** Sort key so sections read in schedule order: weekdays (by role), then weekly/monthly/etc. */
function sectionRank(name: string): [number, number, number, string] {
  const lower = name.toLowerCase();
  const num = lower.match(/^(\d+)\s*\|/);
  if (num) return [2, parseInt(num[1], 10), 0, lower];
  const day = lower.match(/^(mon|tue|wed|thur|thu|fri|sat|sun)\b/);
  if (day) {
    const roleKey = Object.keys(ROLE).find((r) => lower.includes(r));
    return [1, DAY[day[1]] ?? 9, roleKey ? ROLE[roleKey] : 4, lower];
  }
  return [3, 0, 0, lower];
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ spaceId: string }> }) {
  const { spaceId } = await params;
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (role !== "superadmin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const token = process.env.CLICKUP_API_TOKEN;
  const teamId = process.env.CLICKUP_TEAM_ID;
  if (!token || !teamId) return NextResponse.json({ configured: false });

  try {
    const branches = await getBranchSpaces(teamId, token);
    const branch = branches.find((b) => b.id === spaceId);
    if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 404 });

    const tasks = await getSpaceOpenTasks(teamId, spaceId, token);

    const byFolder = new Map<string, ClickUpTaskView[]>();
    for (const task of tasks) {
      const key = task.folderName || "Other";
      const list = byFolder.get(key) ?? [];
      list.push(task);
      byFolder.set(key, list);
    }

    const sections = [...byFolder.entries()]
      .map(([name, sectionTasks]) => ({
        name,
        total: sectionTasks.length,
        statusBreakdown: aggregateByStatus(sectionTasks),
      }))
      .sort((a, b) => {
        const ra = sectionRank(a.name);
        const rb = sectionRank(b.name);
        for (let i = 0; i < 4; i++) {
          if (ra[i] < rb[i]) return -1;
          if (ra[i] > rb[i]) return 1;
        }
        return 0;
      });

    return NextResponse.json({
      configured: true,
      branch,
      totalTaskCount: tasks.length,
      sections,
    });
  } catch {
    return NextResponse.json({ error: "Failed to load branch dashboard" }, { status: 502 });
  }
}
