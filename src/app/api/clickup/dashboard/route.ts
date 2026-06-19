import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import {
  getOpenTasks,
  matchOwnerToRoster,
  aggregateByStatus,
  type ClickUpTaskView,
} from "@/lib/clickup";
import { getEmployeeRoster, getDepartments } from "@/lib/clickup-queries";

export const dynamic = "force-dynamic";

const NO_DEPARTMENT = "(No department)";
const UNASSIGNED = "(Unassigned)";

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
    const [roster, departments, tasks] = await Promise.all([
      getEmployeeRoster(),
      getDepartments(),
      getOpenTasks(teamId, token),
    ]);

    const deptIdToName = new Map(departments.map((d) => [d.id, d.name]));
    const userIdToDeptId = new Map(roster.map((r) => [r.userId, r.departmentId]));

    // Group every task under a department (via its matched owner), or the
    // (No department) / (Unassigned) buckets, then aggregate status per group.
    const tasksByDept = new Map<string, ClickUpTaskView[]>();
    for (const task of tasks) {
      const ownerUserId = matchOwnerToRoster(task.ownerName, roster);
      let key: string;
      if (ownerUserId !== null) {
        const deptId = userIdToDeptId.get(ownerUserId) ?? null;
        key = deptId !== null ? deptIdToName.get(deptId) ?? `Dept ${deptId}` : NO_DEPARTMENT;
      } else {
        key = UNASSIGNED;
      }
      const list = tasksByDept.get(key) ?? [];
      list.push(task);
      tasksByDept.set(key, list);
    }

    const departmentBreakdowns = [...tasksByDept.entries()]
      .map(([departmentName, deptTasks]) => ({
        departmentName,
        total: deptTasks.length,
        statusBreakdown: aggregateByStatus(deptTasks),
      }))
      .sort((a, b) => b.total - a.total);

    return NextResponse.json({
      configured: true,
      totalTaskCount: tasks.length,
      overall: aggregateByStatus(tasks),
      departments: departmentBreakdowns,
    });
  } catch {
    return NextResponse.json({ error: "Failed to load ClickUp dashboard" }, { status: 502 });
  }
}
