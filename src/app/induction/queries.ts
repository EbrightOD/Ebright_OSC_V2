import "server-only";
import { prisma } from "@/lib/prisma";
import { titleCaseName } from "@/lib/text";

export interface InductionEmployeeOption {
  userId: number;
  email: string;
  fullName: string;
  departmentName: string | null;
  position: string | null;
}

/**
 * Active employees usable as the induction subject or as a buddy.
 * Limited to staff/admin/ceo roles to avoid noisy superadmin entries.
 */
export async function listInductionEligibleEmployees(): Promise<InductionEmployeeOption[]> {
  const rows = await prisma.users.findMany({
    where: {
      status: "active",
      role: { role_type: { in: ["staff", "admin", "ceo", "hr"] } },
    },
    include: {
      user_profile: { select: { full_name: true } },
      employment: {
        where: { status: "active" },
        include: { department: true },
        orderBy: { start_date: "desc" },
        take: 1,
      },
    },
    orderBy: { email: "asc" },
  });

  return rows.map((u) => {
    const emp = u.employment[0];
    return {
      userId: u.user_id,
      email: u.email,
      fullName: titleCaseName(u.user_profile?.full_name) || u.email,
      departmentName: emp?.department?.department_name ?? null,
      position: emp?.position ?? null,
    };
  });
}

export interface PendingInductionRow {
  id: number;
  employeeName: string;
  employeeEmail: string;
  inductionType: string;
  workflowTemplate: string;
  status: string;
  startDate: string;
  exitDate: string | null;
  linkToken: string;
  linkExpiresAt: string;
  createdAt: string;
  buddyName: string | null;
  totalSteps: number;
  completedSteps: number;
}

export async function listAllInductionProfiles(): Promise<PendingInductionRow[]> {
  const rows = await prisma.induction_profile.findMany({
    include: {
      user: { include: { user_profile: { select: { full_name: true } } } },
      buddy: { include: { user_profile: { select: { full_name: true } } } },
      steps: { select: { status: true } },
    },
    orderBy: { created_at: "desc" },
  });

  return rows.map((p) => {
    const completed = p.steps.filter((s) => s.status === "Completed").length;
    return {
      id: p.id,
      employeeName: titleCaseName(p.user.user_profile?.full_name) || p.user.email,
      employeeEmail: p.user.email,
      inductionType: p.induction_type,
      workflowTemplate: p.workflow_template,
      status: p.status,
      startDate: p.start_date.toISOString().slice(0, 10),
      exitDate: p.exit_date ? p.exit_date.toISOString().slice(0, 10) : null,
      linkToken: p.link_token,
      linkExpiresAt: p.link_expires_at.toISOString(),
      createdAt: p.created_at.toISOString(),
      buddyName: p.buddy?.user_profile?.full_name
        ? titleCaseName(p.buddy.user_profile.full_name)
        : p.buddy?.email ?? null,
      totalSteps: p.steps.length,
      completedSteps: completed,
    };
  });
}

export interface InductionStepView {
  id: number;
  stepNumber: number;
  title: string;
  description: string | null;
  responsibleName: string | null;
  responsibleEmail: string | null;
  dueDate: string;
  status: "Pending" | "In Progress" | "Completed";
  completedAt: string | null;
}

export interface InductionView {
  id: number;
  userId: number;
  employeeName: string;
  employeeEmail: string;
  departmentName: string | null;
  inductionType: string;
  workflowTemplate: string;
  startDate: string;
  exitDate: string | null;
  linkToken: string;
  linkExpiresAt: string;
  status: string;
  buddyName: string | null;
  buddyEmail: string | null;
  steps: InductionStepView[];
}

export interface UpcomingHireRow {
  userId: number;
  email: string;
  fullName: string;
  position: string | null;
  departmentName: string | null;
  startDate: string;
  daysUntilStart: number;
  isWithin7Days: boolean;
  hasPendingRequest: boolean;
  inductionProfileStatus: string | null;
}

export interface UpcomingExitRow {
  userId: number;
  email: string;
  fullName: string;
  position: string | null;
  departmentName: string | null;
  endDate: string;
  daysUntilEnd: number;
  isWithin7Days: boolean;
  hasPendingRequest: boolean;
  inductionProfileStatus: string | null;
}

export interface PendingInductionRequestRow {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  departmentName: string | null;
  position: string | null;
  startDate: string | null;
  endDate: string | null;
  triggeredByName: string;
  triggeredAt: string;
  status: string;
}

function startOfTodayUtc(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function addDaysUtc(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function diffInDaysUtc(a: Date, b: Date): number {
  const ms = a.getTime() - b.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export async function getUpcomingHires(daysAhead: number = 180): Promise<UpcomingHireRow[]> {
  const today = startOfTodayUtc();
  const horizon = addDaysUtc(today, daysAhead);

  const rows = await prisma.employment.findMany({
    where: {
      status: { in: ["active", "onboarding"] },
      start_date: { gte: today, lte: horizon },
    },
    include: {
      users: {
        include: {
          user_profile: { select: { full_name: true } },
          induction_profile: { select: { status: true } },
          induction_request_user: {
            where: { status: "pending" },
            select: { id: true },
          },
        },
      },
      department: true,
    },
    orderBy: { start_date: "asc" },
  });

  return rows
    .filter((r) => r.start_date !== null)
    .map((r) => {
      const startDate = r.start_date as Date;
      const days = diffInDaysUtc(startDate, today);
      return {
        userId: r.user_id,
        email: r.users.email,
        fullName: titleCaseName(r.users.user_profile?.full_name) || r.users.email,
        position: r.position,
        departmentName: r.department?.department_name ?? null,
        startDate: startDate.toISOString().slice(0, 10),
        daysUntilStart: days,
        isWithin7Days: days <= 7,
        hasPendingRequest: r.users.induction_request_user.length > 0,
        inductionProfileStatus: r.users.induction_profile?.status ?? null,
      };
    });
}

export async function getUpcomingExits(daysAhead: number = 60): Promise<UpcomingExitRow[]> {
  const today = startOfTodayUtc();
  const horizon = addDaysUtc(today, daysAhead);

  const rows = await prisma.employment.findMany({
    where: {
      status: { in: ["active", "offboarding"] },
      end_date: { gte: today, lte: horizon },
    },
    include: {
      users: {
        include: {
          user_profile: { select: { full_name: true } },
          induction_profile: { select: { status: true } },
          induction_request_user: {
            where: { status: "pending" },
            select: { id: true },
          },
        },
      },
      department: true,
    },
    orderBy: { end_date: "asc" },
  });

  return rows
    .filter((r) => r.end_date !== null)
    .map((r) => {
      const endDate = r.end_date as Date;
      const days = diffInDaysUtc(endDate, today);
      return {
        userId: r.user_id,
        email: r.users.email,
        fullName: titleCaseName(r.users.user_profile?.full_name) || r.users.email,
        position: r.position,
        departmentName: r.department?.department_name ?? null,
        endDate: endDate.toISOString().slice(0, 10),
        daysUntilEnd: days,
        isWithin7Days: days <= 7,
        hasPendingRequest: r.users.induction_request_user.length > 0,
        inductionProfileStatus: r.users.induction_profile?.status ?? null,
      };
    });
}

export interface LeaveOnDateRow {
  leaveId: number;
  userId: number;
  fullName: string;
  email: string;
  leaveTypeCode: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
}

export async function getLeavesActiveToday(typeCode: string): Promise<LeaveOnDateRow[]> {
  const today = startOfTodayUtc();

  const rows = await prisma.leave_request.findMany({
    where: {
      status: "approved",
      start_date: { lte: today },
      end_date: { gte: today },
      leave_types: { leave_type_code: typeCode },
    },
    include: {
      users_leave_request_user_idTousers: {
        include: { user_profile: { select: { full_name: true } } },
      },
      leave_types: true,
    },
    orderBy: { start_date: "asc" },
  });

  return rows.map((r) => {
    const user = r.users_leave_request_user_idTousers;
    return {
      leaveId: r.leave_id,
      userId: r.user_id,
      fullName: titleCaseName(user.user_profile?.full_name) || user.email,
      email: user.email,
      leaveTypeCode: r.leave_types.leave_type_code,
      leaveTypeName: r.leave_types.name,
      startDate: r.start_date.toISOString().slice(0, 10),
      endDate: r.end_date.toISOString().slice(0, 10),
    };
  });
}

export async function listPendingInductionRequests(): Promise<PendingInductionRequestRow[]> {
  const rows = await prisma.induction_request.findMany({
    where: { status: "pending" },
    include: {
      user: {
        include: {
          user_profile: { select: { full_name: true } },
          employment: {
            where: { status: "active" },
            include: { department: true },
            orderBy: { start_date: "desc" },
            take: 1,
          },
        },
      },
      triggered_by: {
        include: { user_profile: { select: { full_name: true } } },
      },
    },
    orderBy: { triggered_at: "desc" },
  });

  return rows.map((r) => {
    const emp = r.user.employment[0];
    return {
      id: r.id,
      userId: r.user_id,
      fullName: titleCaseName(r.user.user_profile?.full_name) || r.user.email,
      email: r.user.email,
      departmentName: emp?.department?.department_name ?? null,
      position: emp?.position ?? null,
      startDate: emp?.start_date ? emp.start_date.toISOString().slice(0, 10) : null,
      endDate: emp?.end_date ? emp.end_date.toISOString().slice(0, 10) : null,
      triggeredByName:
        titleCaseName(r.triggered_by.user_profile?.full_name) || r.triggered_by.email,
      triggeredAt: r.triggered_at.toISOString(),
      status: r.status,
    };
  });
}

export type GetInductionByTokenResult =
  | { ok: true; profile: InductionView }
  | { ok: false; error: "not_found" | "expired" };

export async function getOwnInductionView(userId: number): Promise<InductionView | null> {
  if (!Number.isFinite(userId) || userId <= 0) return null;

  const profile = await prisma.induction_profile.findUnique({
    where: { user_id: userId },
    include: {
      user: {
        include: {
          user_profile: { select: { full_name: true } },
          employment: {
            where: { status: "active" },
            include: { department: true },
            orderBy: { start_date: "desc" },
            take: 1,
          },
        },
      },
      buddy: { include: { user_profile: { select: { full_name: true } } } },
      steps: {
        include: {
          responsible_person: {
            select: { email: true, user_profile: { select: { full_name: true } } },
          },
        },
        orderBy: { step_number: "asc" },
      },
    },
  });

  if (!profile) return null;

  const department = profile.user.employment[0]?.department?.department_name ?? null;

  return {
    id: profile.id,
    userId: profile.user_id,
    employeeName:
      titleCaseName(profile.user.user_profile?.full_name) || profile.user.email,
    employeeEmail: profile.user.email,
    departmentName: department,
    inductionType: profile.induction_type,
    workflowTemplate: profile.workflow_template,
    startDate: profile.start_date.toISOString().slice(0, 10),
    exitDate: profile.exit_date ? profile.exit_date.toISOString().slice(0, 10) : null,
    linkToken: profile.link_token,
    linkExpiresAt: profile.link_expires_at.toISOString(),
    status: profile.status,
    buddyName: profile.buddy?.user_profile?.full_name
      ? titleCaseName(profile.buddy.user_profile.full_name)
      : profile.buddy?.email ?? null,
    buddyEmail: profile.buddy?.email ?? null,
    steps: profile.steps.map((s) => ({
      id: s.id,
      stepNumber: s.step_number,
      title: s.title,
      description: s.description,
      responsibleName: s.responsible_person?.user_profile?.full_name
        ? titleCaseName(s.responsible_person.user_profile.full_name)
        : s.responsible_person?.email ?? null,
      responsibleEmail: s.responsible_person?.email ?? null,
      dueDate: s.due_date.toISOString().slice(0, 10),
      status: (s.status as InductionStepView["status"]) ?? "Pending",
      completedAt: s.completed_at ? s.completed_at.toISOString() : null,
    })),
  };
}

export async function getInductionByToken(token: string): Promise<GetInductionByTokenResult> {
  if (!token || typeof token !== "string") return { ok: false, error: "not_found" };

  const profile = await prisma.induction_profile.findUnique({
    where: { link_token: token },
    include: {
      user: {
        include: {
          user_profile: { select: { full_name: true } },
          employment: {
            where: { status: "active" },
            include: { department: true },
            orderBy: { start_date: "desc" },
            take: 1,
          },
        },
      },
      buddy: { include: { user_profile: { select: { full_name: true } } } },
      steps: {
        include: {
          responsible_person: {
            select: { email: true, user_profile: { select: { full_name: true } } },
          },
        },
        orderBy: { step_number: "asc" },
      },
    },
  });

  if (!profile) return { ok: false, error: "not_found" };
  if (profile.link_expires_at.getTime() < Date.now()) {
    return { ok: false, error: "expired" };
  }

  const department =
    profile.user.employment[0]?.department?.department_name ?? null;

  return {
    ok: true,
    profile: {
      id: profile.id,
      userId: profile.user_id,
      employeeName:
        titleCaseName(profile.user.user_profile?.full_name) || profile.user.email,
      employeeEmail: profile.user.email,
      departmentName: department,
      inductionType: profile.induction_type,
      workflowTemplate: profile.workflow_template,
      startDate: profile.start_date.toISOString().slice(0, 10),
      exitDate: profile.exit_date ? profile.exit_date.toISOString().slice(0, 10) : null,
      linkToken: profile.link_token,
      linkExpiresAt: profile.link_expires_at.toISOString(),
      status: profile.status,
      buddyName: profile.buddy?.user_profile?.full_name
        ? titleCaseName(profile.buddy.user_profile.full_name)
        : profile.buddy?.email ?? null,
      buddyEmail: profile.buddy?.email ?? null,
      steps: profile.steps.map((s) => ({
        id: s.id,
        stepNumber: s.step_number,
        title: s.title,
        description: s.description,
        responsibleName: s.responsible_person?.user_profile?.full_name
          ? titleCaseName(s.responsible_person.user_profile.full_name)
          : s.responsible_person?.email ?? null,
        responsibleEmail: s.responsible_person?.email ?? null,
        dueDate: s.due_date.toISOString().slice(0, 10),
        status: (s.status as InductionStepView["status"]) ?? "Pending",
        completedAt: s.completed_at ? s.completed_at.toISOString() : null,
      })),
    },
  };
}
