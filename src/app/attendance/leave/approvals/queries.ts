import "server-only";
import { prisma } from "@/lib/prisma";

export interface ApprovalRow {
  leaveId: number;
  displayId: string;
  employeeUserId: number;
  employeeName: string;
  employeeRole: string;
  department: string;
  leaveTypeCode: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string | null;
  remarks: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  appliedAt: string;
}

export async function getApproverDepartmentId(approverUserId: number): Promise<number | null> {
  const emp = await prisma.employment.findFirst({
    where: { user_id: approverUserId, status: "active" },
    select: { department_id: true },
  });
  return emp?.department_id ?? null;
}

export async function listApprovalRows(approverUserId: number, role: string): Promise<ApprovalRow[]> {
  const isSuperadmin = role === "superadmin";
  const deptId = isSuperadmin ? null : await getApproverDepartmentId(approverUserId);

  const requests = await prisma.leave_request.findMany({
    where: isSuperadmin
      ? {}
      : {
          NOT: { user_id: approverUserId },
          users_leave_request_user_idTousers: {
            employment: {
              some: { status: "active", department_id: deptId ?? -1 },
            },
          },
        },
    orderBy: { applied_at: "desc" },
    include: {
      leave_types: { select: { leave_type_code: true, name: true } },
      users_leave_request_user_idTousers: {
        select: {
          user_id: true,
          email: true,
          user_profile: { select: { full_name: true } },
          employment: {
            where: { status: "active" },
            take: 1,
            select: {
              position: true,
              department: { select: { department_name: true } },
            },
          },
        },
      },
    },
  });

  return requests.map((r) => {
    const u = r.users_leave_request_user_idTousers;
    const emp = u.employment[0];
    const fullName = u.user_profile?.full_name?.trim() || u.email.split("@")[0];
    const status = (r.status ?? "pending") as ApprovalRow["status"];
    return {
      leaveId: r.leave_id,
      displayId: `LV-${String(r.leave_id).padStart(3, "0")}`,
      employeeUserId: u.user_id,
      employeeName: fullName,
      employeeRole: emp?.position ?? "—",
      department: emp?.department?.department_name ?? "—",
      leaveTypeCode: r.leave_types.leave_type_code,
      leaveTypeName: r.leave_types.name,
      startDate: r.start_date.toISOString().slice(0, 10),
      endDate: r.end_date.toISOString().slice(0, 10),
      totalDays: Number(r.total_days),
      reason: r.reason,
      remarks: r.remarks,
      status,
      appliedAt: r.applied_at.toISOString(),
    };
  });
}
