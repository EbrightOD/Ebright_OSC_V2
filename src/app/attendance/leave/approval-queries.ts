import { prisma } from "@/lib/prisma";

export interface HodPendingRow {
  leaveId: number;
  displayId: string;
  requesterName: string;
  departmentName: string | null;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string | null;
  appliedAt: string;
}

/** Active department id for a user, or null if they have no active employment. */
export async function getActiveDepartmentId(userId: number): Promise<number | null> {
  const emp = await prisma.employment.findFirst({
    where: { user_id: userId, status: "active" },
    select: { department_id: true },
  });
  return emp?.department_id ?? null;
}

const pendingWhere = (departmentId: number) => ({
  status: "pending",
  users_leave_request_user_idTousers: {
    employment: { some: { status: "active", department_id: departmentId } },
  },
});

/** Pending requests in a department, for the HOD action list. */
export async function loadHodPending(departmentId: number): Promise<HodPendingRow[]> {
  const rows = await prisma.leave_request.findMany({
    where: pendingWhere(departmentId),
    orderBy: { applied_at: "asc" },
    include: {
      leave_types: { select: { name: true } },
      users_leave_request_user_idTousers: {
        select: {
          user_profile: { select: { full_name: true } },
          employment: {
            where: { status: "active" },
            take: 1,
            select: { department: { select: { department_name: true } } },
          },
        },
      },
    },
  });

  return rows.map((r) => {
    const requester = r.users_leave_request_user_idTousers;
    return {
      leaveId: r.leave_id,
      displayId: `LV-${String(r.leave_id).padStart(3, "0")}`,
      requesterName: requester.user_profile?.full_name ?? "Unknown",
      departmentName: requester.employment[0]?.department?.department_name ?? null,
      leaveTypeName: r.leave_types.name,
      startDate: r.start_date.toISOString().slice(0, 10),
      endDate: r.end_date.toISOString().slice(0, 10),
      totalDays: Number(r.total_days),
      reason: r.reason,
      appliedAt: r.applied_at.toISOString(),
    };
  });
}

export async function countHodPending(departmentId: number): Promise<number> {
  return prisma.leave_request.count({ where: pendingWhere(departmentId) });
}

/** HOD-approved requests, company-wide, awaiting HR's final approval. */
export async function loadHrQueue(): Promise<HodPendingRow[]> {
  const rows = await prisma.leave_request.findMany({
    where: { status: "hod_approved" },
    orderBy: { applied_at: "asc" },
    include: {
      leave_types: { select: { name: true } },
      users_leave_request_user_idTousers: {
        select: {
          user_profile: { select: { full_name: true } },
          employment: {
            where: { status: "active" },
            take: 1,
            select: { department: { select: { department_name: true } } },
          },
        },
      },
    },
  });

  return rows.map((r) => {
    const requester = r.users_leave_request_user_idTousers;
    return {
      leaveId: r.leave_id,
      displayId: `LV-${String(r.leave_id).padStart(3, "0")}`,
      requesterName: requester.user_profile?.full_name ?? "Unknown",
      departmentName: requester.employment[0]?.department?.department_name ?? null,
      leaveTypeName: r.leave_types.name,
      startDate: r.start_date.toISOString().slice(0, 10),
      endDate: r.end_date.toISOString().slice(0, 10),
      totalDays: Number(r.total_days),
      reason: r.reason,
      appliedAt: r.applied_at.toISOString(),
    };
  });
}

export async function countHrQueue(): Promise<number> {
  return prisma.leave_request.count({ where: { status: "hod_approved" } });
}

// --- Read-only leave records (oversight views) ---------------------------------

export interface LeaveRecordRow {
  leaveId: number;
  displayId: string;
  requesterName: string;
  departmentName: string | null;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: string;
  appliedAt: string;
}

const recordInclude = {
  leave_types: { select: { name: true } },
  users_leave_request_user_idTousers: {
    select: {
      user_profile: { select: { full_name: true } },
      employment: {
        where: { status: "active" },
        take: 1,
        select: { department: { select: { department_name: true } } },
      },
    },
  },
} as const;

type LeaveRecordQueryRow = {
  leave_id: number;
  start_date: Date;
  end_date: Date;
  total_days: unknown;
  status: string;
  applied_at: Date;
  leave_types: { name: string };
  users_leave_request_user_idTousers: {
    user_profile: { full_name: string } | null;
    employment: { department: { department_name: string } | null }[];
  };
};

function toRecordRow(r: LeaveRecordQueryRow): LeaveRecordRow {
  const requester = r.users_leave_request_user_idTousers;
  return {
    leaveId: r.leave_id,
    displayId: `LV-${String(r.leave_id).padStart(3, "0")}`,
    requesterName: requester.user_profile?.full_name ?? "Unknown",
    departmentName: requester.employment[0]?.department?.department_name ?? null,
    leaveTypeName: r.leave_types.name,
    startDate: r.start_date.toISOString().slice(0, 10),
    endDate: r.end_date.toISOString().slice(0, 10),
    totalDays: Number(r.total_days),
    status: r.status,
    appliedAt: r.applied_at.toISOString(),
  };
}

/** Department id for a department name, or null if not found. */
export async function getDepartmentIdByName(name: string): Promise<number | null> {
  const dept = await prisma.department.findFirst({
    where: { department_name: name },
    select: { department_id: true },
  });
  return dept?.department_id ?? null;
}

/** Every leave request, all statuses, newest first. */
export async function loadAllLeaveRecords(): Promise<LeaveRecordRow[]> {
  const rows = await prisma.leave_request.findMany({
    orderBy: { applied_at: "desc" },
    include: recordInclude,
  });
  return rows.map(toRecordRow);
}

/** Leave requests whose requester is in the given department, all statuses, newest first. */
export async function loadDepartmentLeaveRecords(departmentId: number): Promise<LeaveRecordRow[]> {
  const rows = await prisma.leave_request.findMany({
    where: {
      users_leave_request_user_idTousers: {
        employment: { some: { status: "active", department_id: departmentId } },
      },
    },
    orderBy: { applied_at: "desc" },
    include: recordInclude,
  });
  return rows.map(toRecordRow);
}
