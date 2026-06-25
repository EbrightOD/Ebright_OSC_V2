import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import {
  getSpaceTasks,
  operationalDay,
  sortByDueDate,
  statusColor,
} from "@/lib/clickup";

export const dynamic = "force-dynamic";

/** Drill-down: tasks in a branch space filtered by schedule section and (optional) status. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ spaceId: string }> }) {
  const { spaceId } = await params;
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (role !== "superadmin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const token = process.env.CLICKUP_API_TOKEN;
  const teamId = process.env.CLICKUP_TEAM_ID;
  if (!token || !teamId) return NextResponse.json({ configured: false });

  const section = req.nextUrl.searchParams.get("section");
  const statusParam = req.nextUrl.searchParams.get("status");

  try {
    const all = await getSpaceTasks(teamId, spaceId, token, { subtasks: false });
    const filtered = all.filter((t) => {
      const day = operationalDay(t.folderName, t.listName);
      const sectionMatch = !section || day === section;
      const statusMatch = !statusParam || (t.status || "no status") === statusParam;
      return sectionMatch && statusMatch;
    });

    const tasks = sortByDueDate(filtered).map((t) => ({
      id: t.id,
      name: t.name,
      status: t.status,
      statusColor: statusColor(t.status, t.statusColor),
      dueDate: t.dueDate,
      listName: t.listName,
      url: t.url,
    }));

    return NextResponse.json({ tasks });
  } catch {
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 502 });
  }
}
