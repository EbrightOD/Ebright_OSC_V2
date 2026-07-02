import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/app/components/AppShell";
import LeaveRequestsView, {
  type LeaveRow,
  type LeaveStatusCounts,
} from "@/app/components/LeaveRequestsView";
import { HOD_POSITION, formatLeaveDisplayId, resolveLeaveRecordsAccess } from "./approval-logic";
import { getActiveDepartmentId, loadHodPending } from "./approval-queries";

export const dynamic = "force-dynamic";

export default async function LeavePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");


  if (
    resolveLeaveRecordsAccess({
      role: (session.user as { role?: string } | undefined)?.role ?? "",
      email: session.user.email,
    }).kind !== "none"
  ) {
    redirect("/attendance/leave/records");
  }

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
    displayId: formatLeaveDisplayId(r.leave_types.leave_type_code, r.leave_id),
    leaveTypeCode: r.leave_types.leave_type_code,
    leaveTypeName: r.leave_types.name,
    startDate: r.start_date.toISOString().slice(0, 10),
    endDate: r.end_date.toISOString().slice(0, 10),
    totalDays: Number(r.total_days),
    reason: r.reason,
    rejectionReason: r.remarks,
    status: r.status,
    appliedAt: r.applied_at.toISOString(),
  }));

  const counts: LeaveStatusCounts = {
    total: rows.length,
    pending: 0,
    hod_approved: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
  };
  for (const r of rows) {
    if (r.status in counts) counts[r.status as keyof LeaveStatusCounts] += 1;
  }

  const userEmail = session.user?.email ?? "";
  const userRole = (session.user as { role?: string } | undefined)?.role ?? "";
  const userPosition = (session.user as { position?: string } | undefined)?.position ?? "";
  const userName = session.user?.name ?? null;

 
  const isHod = userPosition === HOD_POSITION;
  const departmentId = isHod ? await getActiveDepartmentId(me.user_id) : null;
  const approvalItems = departmentId != null ? await loadHodPending(departmentId) : [];

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <LeaveRequestsView
        rows={rows}
        counts={counts}
        canApprove={isHod}
        viewerIsHod={isHod}
        approvalItems={approvalItems}
      />
    </AppShell>
  );
}
