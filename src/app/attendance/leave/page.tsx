import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/app/components/AppShell";
import LeaveRequestsView, {
  type LeaveRow,
  type LeaveStatusCounts,
} from "@/app/components/LeaveRequestsView";

export const dynamic = "force-dynamic";

export default async function LeavePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const me = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { user_id: true },
  });
  if (!me) redirect("/login");

  const requests = await prisma.leave_request.findMany({
    where: { user_id: me.user_id },
    orderBy: { applied_at: "desc" },
    include: {
      leave_types: { select: { leave_type_code: true, name: true } },
    },
  });

  const rows: LeaveRow[] = requests.map((r) => ({
    leaveId: r.leave_id,
    displayId: `LV-${String(r.leave_id).padStart(3, "0")}`,
    leaveTypeCode: r.leave_types.leave_type_code,
    leaveTypeName: r.leave_types.name,
    startDate: r.start_date.toISOString().slice(0, 10),
    endDate: r.end_date.toISOString().slice(0, 10),
    totalDays: Number(r.total_days),
    reason: r.reason,
    status: r.status,
    appliedAt: r.applied_at.toISOString(),
  }));

  const counts: LeaveStatusCounts = {
    total: rows.length,
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
  };
  for (const r of rows) {
    if (r.status in counts) counts[r.status as keyof LeaveStatusCounts] += 1;
  }

  const userEmail = session.user?.email ?? "";
  const userRole = (session.user as { role?: string } | undefined)?.role ?? "";
  const userName = session.user?.name ?? null;

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <LeaveRequestsView rows={rows} counts={counts} />
    </AppShell>
  );
}
