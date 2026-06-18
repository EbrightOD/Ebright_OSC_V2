import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { getActiveDepartmentId } from "@/app/attendance/leave/approval-queries";
import { resolveTaskScope } from "@/lib/clickup-access";
import {
  getWorkspaceMembers,
  getOpenTasksByAssignees,
  buildIndividuals,
  type TargetUser,
} from "@/lib/clickup";
import { getDepartmentMembers, getDepartmentName } from "@/lib/clickup-queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as
    | { id?: string; email?: string; name?: string; role?: string; position?: string }
    | undefined;
  if (!user?.id || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.CLICKUP_API_TOKEN;
  const teamId = process.env.CLICKUP_TEAM_ID;
  if (!token || !teamId) {
    return NextResponse.json({ configured: false });
  }

  const departmentId = await getActiveDepartmentId(Number(user.id));
  const scope = resolveTaskScope({
    role: user.role,
    position: user.position,
    departmentId,
  });

  let rawTargets: { name: string; email: string }[];
  let departmentName: string;
  if (scope.kind === "department") {
    rawTargets = await getDepartmentMembers(scope.departmentId);
    departmentName = await getDepartmentName(scope.departmentId);
  } else {
    rawTargets = [{ name: user.name ?? user.email, email: user.email }];
    departmentName = "My Tasks";
  }

  try {
    const members = await getWorkspaceMembers(teamId, token);
    const emailToId = new Map(members.map((m) => [m.email, m.id]));

    const targets: TargetUser[] = rawTargets.map((t) => ({
      name: t.name,
      email: t.email,
      linked: emailToId.has(t.email.toLowerCase()),
    }));

    const clickupIds = targets
      .map((t) => emailToId.get(t.email.toLowerCase()))
      .filter((id): id is string => Boolean(id));

    const tasks = await getOpenTasksByAssignees(teamId, clickupIds, token);
    const individuals = buildIndividuals(targets, tasks, user.email);

    return NextResponse.json({
      configured: true,
      scope: scope.kind,
      viewerEmail: user.email.toLowerCase(),
      departments: [{ departmentName, individuals }],
    });
  } catch {
    return NextResponse.json({ error: "Failed to load ClickUp tasks" }, { status: 502 });
  }
}
