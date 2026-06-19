import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import {
  getOpenTasks,
  matchBranches,
  aggregateByStatus,
  type ClickUpTaskView,
} from "@/lib/clickup";
import { getBranches } from "@/lib/clickup-queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const token = process.env.CLICKUP_API_TOKEN;
  const teamId = process.env.CLICKUP_TEAM_ID;
  if (!token || !teamId) {
    return NextResponse.json({ configured: false });
  }

  try {
    const [branches, tasks] = await Promise.all([getBranches(), getOpenTasks(teamId, token)]);

    // A task is "branch-related" if its text mentions a branch. One task can
    // mention several branches, so it can appear under more than one card.
    const tasksByBranch = new Map<string, ClickUpTaskView[]>();
    const branchRelated = new Set<string>();
    for (const task of tasks) {
      const text = `${task.name} ${task.listName} ${task.folderName}`;
      for (const branchName of matchBranches(text, branches)) {
        const list = tasksByBranch.get(branchName) ?? [];
        list.push(task);
        tasksByBranch.set(branchName, list);
        branchRelated.add(task.id);
      }
    }

    const branchBreakdowns = [...tasksByBranch.entries()]
      .map(([branchName, branchTasks]) => ({
        branchName,
        total: branchTasks.length,
        statusBreakdown: aggregateByStatus(branchTasks),
      }))
      .sort((a, b) => b.total - a.total);

    return NextResponse.json({
      configured: true,
      totalTaskCount: tasks.length,
      branchRelatedCount: branchRelated.size,
      branches: branchBreakdowns,
    });
  } catch {
    return NextResponse.json({ error: "Failed to load ClickUp dashboard" }, { status: 502 });
  }
}
