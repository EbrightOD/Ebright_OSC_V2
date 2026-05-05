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

// Format a Date column (Postgres `date`) as YYYY-MM-DD in Asia/Kuala_Lumpur.
// Needed because pg returns `date` columns as JS Date objects shifted by the
// server's session timezone — `.toISOString().slice(0,10)` then renders the
// previous day's UTC date instead of the actual MYT date stored in the DB.
function formatDateMYT(d: Date): string {
  const myt = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  return myt.toISOString().slice(0, 10);
}

export async function getUpcomingHires(
  daysAhead: number = 180,
  daysBack: number = 0,
): Promise<UpcomingHireRow[]> {
  const today = startOfTodayUtc();
  const horizon = addDaysUtc(today, daysAhead);
  const backstop = addDaysUtc(today, -daysBack);

  const rows = await prisma.employment.findMany({
    where: {
      status: { in: ["active", "onboarding"] },
      start_date: { gte: backstop, lte: horizon },
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

export async function getUpcomingExits(
  daysAhead: number = 60,
  daysBack: number = 0,
): Promise<UpcomingExitRow[]> {
  const today = startOfTodayUtc();
  const horizon = addDaysUtc(today, daysAhead);
  const backstop = addDaysUtc(today, -daysBack);

  const rows = await prisma.employment.findMany({
    where: {
      status: { in: ["active", "offboarding"] },
      end_date: { gte: backstop, lte: horizon },
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

// ============ Combined hires/exits (local employment + ebrightleads candidates) ============

export interface CombinedHireRow {
  source: "local" | "ebrightleads";
  key: string;
  userId: number | null;
  email: string | null;
  fullName: string;
  position: string | null;
  departmentName: string | null;
  startDate: string;
  daysUntilStart: number;
  isWithin7Days: boolean;
  hasPendingRequest: boolean;
  inductionProfileStatus: string | null;
}

export interface CombinedExitRow {
  source: "local" | "ebrightleads";
  key: string;
  userId: number | null;
  email: string | null;
  fullName: string;
  position: string | null;
  departmentName: string | null;
  endDate: string;
  daysUntilEnd: number;
  isWithin7Days: boolean;
  hasPendingRequest: boolean;
  inductionProfileStatus: string | null;
}

export async function getCombinedUpcomingHires(
  daysAhead: number = 180,
  daysBack: number = 0,
): Promise<CombinedHireRow[]> {
  const today = startOfTodayUtc();
  const horizon = addDaysUtc(today, daysAhead);
  const backstop = addDaysUtc(today, -daysBack);

  const [local, candidates] = await Promise.all([
    getUpcomingHires(daysAhead, daysBack),
    prisma.onboarding_candidate.findMany({
      where: { start_date: { gte: backstop, lte: horizon } },
      orderBy: { start_date: "asc" },
    }),
  ]);

  const localRows: CombinedHireRow[] = local.map((h) => ({
    source: "local",
    key: `local-${h.userId}`,
    userId: h.userId,
    email: h.email,
    fullName: h.fullName,
    position: h.position,
    departmentName: h.departmentName,
    startDate: h.startDate,
    daysUntilStart: h.daysUntilStart,
    isWithin7Days: h.isWithin7Days,
    hasPendingRequest: h.hasPendingRequest,
    inductionProfileStatus: h.inductionProfileStatus,
  }));

  const candRows: CombinedHireRow[] = candidates.map((c) => ({
    source: "ebrightleads",
    key: `ebr-${c.id}`,
    userId: null,
    email: null,
    fullName: titleCaseName(c.name) || c.name,
    position: c.position,
    departmentName: c.department_branch,
    startDate: formatDateMYT(c.start_date),
    daysUntilStart: diffInDaysUtc(c.start_date, today),
    isWithin7Days: diffInDaysUtc(c.start_date, today) <= 7,
    hasPendingRequest: false,
    inductionProfileStatus: null,
  }));

  return [...localRows, ...candRows].sort((a, b) =>
    a.startDate.localeCompare(b.startDate),
  );
}

export async function getCombinedUpcomingExits(
  daysAhead: number = 60,
  daysBack: number = 0,
): Promise<CombinedExitRow[]> {
  const today = startOfTodayUtc();
  const horizon = addDaysUtc(today, daysAhead);
  const backstop = addDaysUtc(today, -daysBack);

  const [local, candidates] = await Promise.all([
    getUpcomingExits(daysAhead, daysBack),
    prisma.onboarding_candidate.findMany({
      where: { end_date: { gte: backstop, lte: horizon } },
      orderBy: { end_date: "asc" },
    }),
  ]);

  const localRows: CombinedExitRow[] = local.map((e) => ({
    source: "local",
    key: `local-${e.userId}`,
    userId: e.userId,
    email: e.email,
    fullName: e.fullName,
    position: e.position,
    departmentName: e.departmentName,
    endDate: e.endDate,
    daysUntilEnd: e.daysUntilEnd,
    isWithin7Days: e.isWithin7Days,
    hasPendingRequest: e.hasPendingRequest,
    inductionProfileStatus: e.inductionProfileStatus,
  }));

  const candRows: CombinedExitRow[] = candidates
    .filter((c) => c.end_date !== null)
    .map((c) => {
      const endDate = c.end_date as Date;
      return {
        source: "ebrightleads",
        key: `ebr-${c.id}`,
        userId: null,
        email: null,
        fullName: titleCaseName(c.name) || c.name,
        position: c.position,
        departmentName: c.department_branch,
        endDate: formatDateMYT(endDate),
        daysUntilEnd: diffInDaysUtc(endDate, today),
        isWithin7Days: diffInDaysUtc(endDate, today) <= 7,
        hasPendingRequest: false,
        inductionProfileStatus: null,
      };
    });

  return [...localRows, ...candRows].sort((a, b) =>
    a.endDate.localeCompare(b.endDate),
  );
}

// ============ Combined MC / Annual Leave windows ============

async function getLeavesInDateWindow(
  typeCode: string,
  fromDate: Date,
  toDate: Date,
): Promise<LeaveOnDateRow[]> {
  const rows = await prisma.leave_request.findMany({
    where: {
      status: "approved",
      start_date: { lte: toDate },
      end_date: { gte: fromDate },
      leave_types: { leave_type_code: typeCode },
    },
    include: {
      users_leave_request_user_idTousers: {
        include: { user_profile: { select: { full_name: true } } },
      },
      leave_types: true,
    },
    orderBy: { start_date: "desc" },
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

// MC: last 7 days through today
export async function getCombinedMcLeavesPastWeek(): Promise<LeaveOnDateRow[]> {
  const today = startOfTodayUtc();
  const sevenDaysAgo = addDaysUtc(today, -7);

  const [local, ebr] = await Promise.all([
    getLeavesInDateWindow("MC", sevenDaysAgo, today),
    prisma.mc_record.findMany({
      where: { mc_date: { gte: sevenDaysAgo, lte: today } },
      orderBy: { mc_date: "desc" },
    }),
  ]);

  const ebrRows: LeaveOnDateRow[] = ebr.map((r) => {
    const dateStr = formatDateMYT(r.mc_date);
    return {
      leaveId: -r.id,
      userId: -r.id,
      fullName: titleCaseName(r.name) || r.name,
      email: r.department_branch,
      leaveTypeCode: "MC",
      leaveTypeName: r.reason ?? "MC",
      startDate: dateStr,
      endDate: dateStr,
    };
  });

  return [...local, ...ebrRows].sort((a, b) =>
    b.startDate.localeCompare(a.startDate),
  );
}

// Annual Leave: last 7 days through today
export async function getCombinedAnnualLeavesPastWeek(): Promise<LeaveOnDateRow[]> {
  const today = startOfTodayUtc();
  const sevenDaysAgo = addDaysUtc(today, -7);

  const [local, ebr] = await Promise.all([
    getLeavesInDateWindow("AL", sevenDaysAgo, today),
    prisma.annual_leave_record.findMany({
      where: { al_date: { gte: sevenDaysAgo, lte: today } },
      orderBy: { al_date: "desc" },
    }),
  ]);

  const ebrRows: LeaveOnDateRow[] = ebr.map((r) => {
    const dateStr = formatDateMYT(r.al_date);
    return {
      leaveId: -r.id,
      userId: -r.id,
      fullName: titleCaseName(r.name) || r.name,
      email: r.department_branch,
      leaveTypeCode: "AL",
      leaveTypeName: r.al_duration ?? "Annual Leave",
      startDate: dateStr,
      endDate: dateStr,
    };
  });

  return [...local, ...ebrRows].sort((a, b) =>
    b.startDate.localeCompare(a.startDate),
  );
}

// ============ Slice B: onboarding candidates from ebrightleads ============

export interface OnboardingCandidateCounts {
  onboarding: number;
  offboarding: number;
  recentJoins: number;
  active: number;
}

export type CandidateType = "onboarding" | "offboarding" | "recent_join" | "active";

export interface OnboardingCandidateRow {
  id: number;
  name: string;
  position: string;
  departmentBranch: string;
  startDate: string;
  endDate: string | null;
}

export async function getOnboardingCandidateCounts(): Promise<OnboardingCandidateCounts> {
  const [onboarding, offboarding, recentJoins, active] = await Promise.all([
    prisma.onboarding_candidate.count({ where: { candidate_type: "onboarding" } }),
    prisma.onboarding_candidate.count({ where: { candidate_type: "offboarding" } }),
    prisma.onboarding_candidate.count({ where: { candidate_type: "recent_join" } }),
    prisma.onboarding_candidate.count({ where: { candidate_type: "active" } }),
  ]);

  return { onboarding, offboarding, recentJoins, active };
}

export async function getOnboardingCandidatesByType(
  type: CandidateType
): Promise<OnboardingCandidateRow[]> {
  const candidates = await prisma.onboarding_candidate.findMany({
    where: { candidate_type: type },
    orderBy: { start_date: "asc" },
  });

  return candidates.map((c) => ({
    id: c.id,
    name: c.name,
    position: c.position,
    departmentBranch: c.department_branch,
    startDate: c.start_date.toISOString().slice(0, 10),
    endDate: c.end_date ? c.end_date.toISOString().slice(0, 10) : null,
  }));
}

// ============ Slice C: stage metrics from induction_profile ============

export type StageName = "Pre-Join" | "Day 1" | "Week 1" | "Month 1" | "Completed";

export interface StageMetrics {
  stageName: StageName;
  employeeCount: number;
  completionPercentage: number;
}

export interface StageEmployee {
  id: number;
  fullName: string;
  email: string;
  departmentName: string;
  startDate: string;
  stepsCompleted: number;
  totalSteps: number;
  progressPercentage: number;
}

function classifyStage(
  startDate: Date,
  status: string,
  today: Date
): StageName {
  if (startDate > today) return "Pre-Join";

  const days = Math.floor(
    (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (days <= 1) return "Day 1";
  if (days <= 7) return "Week 1";
  if (days <= 30) return "Month 1";
  if (status === "Completed") return "Completed";
  return "Month 1";
}

export async function getOnboardingStageMetrics(): Promise<StageMetrics[]> {
  const today = startOfTodayUtc();

  const profiles = await prisma.induction_profile.findMany({
    include: { steps: { select: { status: true } } },
  });

  const stages: Record<StageName, { count: number; completed: number }> = {
    "Pre-Join": { count: 0, completed: 0 },
    "Day 1": { count: 0, completed: 0 },
    "Week 1": { count: 0, completed: 0 },
    "Month 1": { count: 0, completed: 0 },
    Completed: { count: 0, completed: 0 },
  };

  for (const profile of profiles) {
    const stage = classifyStage(profile.start_date, profile.status, today);
    const total = profile.steps.length;
    const completed = profile.steps.filter((s) => s.status === "Completed").length;

    stages[stage].count++;
    if (total > 0 && completed === total) stages[stage].completed++;
  }

  return (Object.entries(stages) as [StageName, { count: number; completed: number }][]).map(
    ([name, data]) => ({
      stageName: name,
      employeeCount: data.count,
      completionPercentage:
        data.count > 0 ? Math.round((data.completed / data.count) * 100) : 0,
    })
  );
}

export async function getEmployeesInStage(
  stageName: StageName
): Promise<StageEmployee[]> {
  const today = startOfTodayUtc();

  const profiles = await prisma.induction_profile.findMany({
    include: {
      steps: { select: { status: true } },
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
    },
  });

  return profiles
    .filter((p) => classifyStage(p.start_date, p.status, today) === stageName)
    .map((p) => {
      const total = p.steps.length;
      const completed = p.steps.filter((s) => s.status === "Completed").length;
      return {
        id: p.id,
        fullName: titleCaseName(p.user.user_profile?.full_name) || p.user.email,
        email: p.user.email,
        departmentName:
          p.user.employment[0]?.department?.department_name ?? "Unknown",
        startDate: p.start_date.toISOString().slice(0, 10),
        stepsCompleted: completed,
        totalSteps: total,
        progressPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });
}

export interface OnboardingDashboardStats {
  totalNewHiresThisMonth: number;
  branchesCovered: string[];
  pendingChecklists: number;
  averageCompletionRate: number;
}

export async function getOnboardingDashboardStats(): Promise<OnboardingDashboardStats> {
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const profiles = await prisma.induction_profile.findMany({
    where: { start_date: { gte: monthStart } },
    include: {
      steps: { select: { status: true } },
      user: {
        include: {
          employment: {
            where: { status: "active" },
            include: { department: true },
            orderBy: { start_date: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  const branches = new Set<string>();
  for (const p of profiles) {
    const dept = p.user.employment[0]?.department?.department_name;
    if (dept) branches.add(dept);
  }

  const pending = profiles.filter((p) => p.status !== "Completed").length;

  const avgCompletion =
    profiles.length > 0
      ? Math.round(
          (profiles.reduce((sum, p) => {
            const total = p.steps.length;
            const completed = p.steps.filter((s) => s.status === "Completed").length;
            return sum + (total > 0 ? completed / total : 0);
          }, 0) /
            profiles.length) *
            100
        )
      : 0;

  return {
    totalNewHiresThisMonth: profiles.length,
    branchesCovered: Array.from(branches),
    pendingChecklists: pending,
    averageCompletionRate: avgCompletion,
  };
}

// ============ Slice E: analytics & feedback ============

export async function getInductionHealthScore(): Promise<number> {
  const responses = await prisma.survey_response.findMany({
    select: { sentiment_score: true },
  });

  if (responses.length === 0) return 50;

  const avg =
    responses.reduce((sum, r) => sum + (r.sentiment_score ?? 0), 0) /
    responses.length;
  return Math.round(avg * 20);
}

export interface ConfidencePoint {
  milestone: string;
  averageScore: number;
}

export async function getConfidenceTrajectory(): Promise<ConfidencePoint[]> {
  const milestones = ["Day1", "Week2", "Month1", "Month3"] as const;
  const result: ConfidencePoint[] = [];

  for (const milestone of milestones) {
    const responses = await prisma.survey_response.findMany({
      where: { survey_template: { milestone } },
      select: { responses: true },
    });

    if (responses.length === 0) {
      result.push({ milestone, averageScore: 0 });
      continue;
    }

    const scores = responses.map((r) => {
      const data = (r.responses ?? {}) as Record<string, unknown>;
      const key = Object.keys(data).find((k) => k.includes("confidence"));
      const value = key ? data[key] : 3;
      return typeof value === "number" ? value : 3;
    });

    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    result.push({ milestone, averageScore: avg });
  }

  return result;
}

export interface ProblemArea {
  metricName: string;
  currentScore: number;
  percentageResponding: number;
  evidence: string;
}

export async function getProblemAreas(): Promise<ProblemArea[]> {
  const metrics = await prisma.analytics_metric.findMany({
    where: { value: { lt: 60 } },
    orderBy: { timestamp: "desc" },
  });

  return metrics.map((m) => ({
    metricName: m.metric_name,
    currentScore: Math.round(m.value),
    percentageResponding: 100 - Math.round(m.value),
    evidence: `${100 - Math.round(m.value)}% of new hires indicated issues with ${m.metric_name.toLowerCase()}`,
  }));
}

export interface RecommendationRow {
  id: number;
  title: string;
  evidence: string;
  actionItems: string[];
  status: string;
  priority: string;
}

export async function getRecommendations(): Promise<RecommendationRow[]> {
  const rows = await prisma.recommendation.findMany({
    orderBy: [{ status: "asc" }, { due_date: "asc" }],
    select: {
      id: true,
      title: true,
      evidence: true,
      action_items: true,
      status: true,
      priority: true,
    },
  });

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    evidence: r.evidence,
    actionItems: Array.isArray(r.action_items) ? (r.action_items as string[]) : [],
    status: r.status,
    priority: r.priority,
  }));
}

export interface ImpactLogRow {
  recommendationTitle: string;
  metricName: string;
  beforeValue: number;
  afterValue: number;
  improvementPercentage: number;
  measuredAt: string;
}

export async function getImpactLog(): Promise<ImpactLogRow[]> {
  const logs = await prisma.impact_log.findMany({
    include: { recommendation: { select: { title: true } } },
    orderBy: { measured_at: "desc" },
  });

  return logs.map((log) => ({
    recommendationTitle: log.recommendation.title,
    metricName: log.metric_name,
    beforeValue: log.value_before,
    afterValue: log.value_after,
    improvementPercentage: log.improvement_percentage,
    measuredAt: log.measured_at.toISOString().slice(0, 10),
  }));
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
