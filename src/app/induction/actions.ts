"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { prisma } from "@/lib/prisma";
import { canManageInductions } from "@/app/induction/roles";
import {
  WORKFLOW_TEMPLATES,
  computeStepDueDate,
  isKnownTemplate,
} from "@/app/induction/templates";

const TOKEN_TTL_DAYS = 30;

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

function expiryFromNow(days: number = TOKEN_TTL_DAYS): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function s(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function dateOnlyOrNull(value: string): Date | null {
  if (!value) return null;
  // Treat YYYY-MM-DD as midnight UTC so Postgres @db.Date stores the intended day.
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const dt = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return Number.isNaN(dt.getTime()) ? null : dt;
}

async function loadActorAndAuthorize(): Promise<
  | { ok: true; actor: { user_id: number; role_type: string | null } }
  | { ok: false; error: string }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { ok: false, error: "Not authenticated." };

  const actor = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: {
      user_id: true,
      role: { select: { role_type: true } },
    },
  });
  if (!actor) return { ok: false, error: "User record not found." };
  if (!canManageInductions(actor.role?.role_type ?? null)) {
    return { ok: false, error: "You do not have permission to manage inductions." };
  }
  return {
    ok: true,
    actor: { user_id: actor.user_id, role_type: actor.role?.role_type ?? null },
  };
}

export interface CreateInductionResult {
  ok: boolean;
  error?: string;
  inductionProfileId?: number;
  token?: string;
}

export async function createInduction(
  _prev: CreateInductionResult | null,
  formData: FormData,
): Promise<CreateInductionResult> {
  const auth = await loadActorAndAuthorize();
  if (!auth.ok) return { ok: false, error: auth.error };

  const userIdRaw = s(formData, "user_id");
  const userId = Number.parseInt(userIdRaw, 10);
  if (!Number.isFinite(userId)) return { ok: false, error: "Employee is required." };

  const inductionType = s(formData, "induction_type");
  if (!["Onboarding", "Offboarding"].includes(inductionType)) {
    return { ok: false, error: "Induction type must be Onboarding or Offboarding." };
  }

  const template = s(formData, "workflow_template") || "Standard";
  if (!isKnownTemplate(template)) {
    return { ok: false, error: `Unknown workflow template "${template}".` };
  }

  const startDate = dateOnlyOrNull(s(formData, "start_date"));
  if (!startDate) return { ok: false, error: "Start date is required (YYYY-MM-DD)." };

  const exitDateRaw = s(formData, "exit_date");
  const exitDate = exitDateRaw ? dateOnlyOrNull(exitDateRaw) : null;
  if (exitDateRaw && !exitDate) return { ok: false, error: "Exit date is invalid." };

  const buddyIdRaw = s(formData, "buddy_user_id");
  const buddyId = buddyIdRaw ? Number.parseInt(buddyIdRaw, 10) : NaN;
  const buddyUserId = Number.isFinite(buddyId) ? buddyId : null;
  if (buddyUserId !== null && buddyUserId === userId) {
    return { ok: false, error: "Buddy must be a different employee." };
  }

  const employee = await prisma.users.findUnique({
    where: { user_id: userId },
    select: { user_id: true, email: true, status: true, user_profile: { select: { full_name: true } } },
  });
  if (!employee) return { ok: false, error: "Selected employee not found." };

  if (buddyUserId !== null) {
    const buddy = await prisma.users.findUnique({
      where: { user_id: buddyUserId },
      select: { user_id: true },
    });
    if (!buddy) return { ok: false, error: "Selected buddy not found." };
  }

  const existing = await prisma.induction_profile.findUnique({
    where: { user_id: userId },
    select: { id: true },
  });
  if (existing) {
    return {
      ok: false,
      error: "This employee already has an induction profile. Regenerate the link instead.",
    };
  }

  const templateSteps = WORKFLOW_TEMPLATES[template];
  const token = generateToken();
  const expiresAt = expiryFromNow();

  try {
    const created = await prisma.$transaction(async (tx) => {
      const profile = await tx.induction_profile.create({
        data: {
          user_id: userId,
          induction_type: inductionType,
          workflow_template: template,
          buddy_user_id: buddyUserId,
          link_token: token,
          link_expires_at: expiresAt,
          status: "Created",
          start_date: startDate,
          exit_date: exitDate,
          created_by: auth.actor.user_id,
        },
        select: { id: true },
      });

      await tx.induction_step.createMany({
        data: templateSteps.map((step) => ({
          induction_profile_id: profile.id,
          step_number: step.stepNumber,
          title: step.title,
          description: step.description,
          due_date: computeStepDueDate(startDate, step.daysFromStart),
          status: "Pending",
        })),
      });

      return profile;
    });

    const employeeLabel = employee.user_profile?.full_name ?? employee.email;
    console.info(
      "[induction] mock email:",
      JSON.stringify({
        to: employee.email,
        recipient: employeeLabel,
        token,
        link: `/induction/${token}`,
        expiresAt: expiresAt.toISOString(),
      }),
    );

    revalidatePath("/induction/control-centre");

    return { ok: true, inductionProfileId: created.id, token };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown database error.";
    return { ok: false, error: `Could not create induction: ${msg}` };
  }
}

export interface RegenerateTokenResult {
  ok: boolean;
  error?: string;
  token?: string;
  expiresAt?: string;
}

export async function regenerateInductionToken(
  inductionProfileId: number,
): Promise<RegenerateTokenResult> {
  const auth = await loadActorAndAuthorize();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!Number.isFinite(inductionProfileId) || inductionProfileId <= 0) {
    return { ok: false, error: "Invalid induction profile id." };
  }

  const token = generateToken();
  const expiresAt = expiryFromNow();

  try {
    await prisma.induction_profile.update({
      where: { id: inductionProfileId },
      data: {
        link_token: token,
        link_expires_at: expiresAt,
        status: "Sent",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown database error.";
    return { ok: false, error: `Could not regenerate token: ${msg}` };
  }

  revalidatePath("/induction/control-centre");
  return { ok: true, token, expiresAt: expiresAt.toISOString() };
}

export interface CreateInductionRequestResult {
  ok: boolean;
  error?: string;
  requestId?: number;
}

export async function createInductionRequest(
  targetUserId: number,
): Promise<CreateInductionRequestResult> {
  const auth = await loadActorAndAuthorize();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!Number.isFinite(targetUserId) || targetUserId <= 0) {
    return { ok: false, error: "Invalid employee id." };
  }

  const target = await prisma.users.findUnique({
    where: { user_id: targetUserId },
    select: { user_id: true, status: true },
  });
  if (!target) return { ok: false, error: "Selected employee not found." };

  const existingActive = await prisma.induction_request.findFirst({
    where: { user_id: targetUserId, status: { not: "completed" } },
    select: { id: true, status: true },
  });
  if (existingActive) {
    return {
      ok: false,
      error: `An induction request for this employee is already ${existingActive.status}.`,
    };
  }

  try {
    const created = await prisma.induction_request.create({
      data: {
        user_id: targetUserId,
        triggered_by_id: auth.actor.user_id,
        status: "pending",
      },
      select: { id: true },
    });
    revalidatePath("/dashboards/hrms");
    revalidatePath("/induction/control-centre");
    return { ok: true, requestId: created.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown database error.";
    return { ok: false, error: `Could not create induction request: ${msg}` };
  }
}

export interface CreateBulkInductionRequestsResult {
  ok: boolean;
  error?: string;
  created: number;
  skipped: number;
}

function slugifyName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ".");
}

export async function createInductionRequestForEbrightCandidate(
  candidateSourceId: number,
): Promise<CreateInductionRequestResult> {
  const auth = await loadActorAndAuthorize();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!Number.isFinite(candidateSourceId)) {
    return { ok: false, error: "Invalid candidate id." };
  }

  const candidate = await prisma.onboarding_candidate.findUnique({
    where: { source_id: candidateSourceId },
  });
  if (!candidate) {
    return { ok: false, error: "Ebrightleads candidate not found." };
  }

  // Reuse if we already promoted this candidate before.
  if (candidate.induction_profile_id) {
    const profile = await prisma.induction_profile.findUnique({
      where: { id: candidate.induction_profile_id },
      select: { user_id: true },
    });
    if (profile) return createInductionRequest(profile.user_id);
  }

  const baseEmail = `${slugifyName(candidate.name) || `candidate-${candidate.source_id}`}@ebrightleads.local`;

  const staffRole = await prisma.role.findFirst({
    where: { role_type: "staff" },
    select: { role_id: true },
  });
  if (!staffRole) {
    return { ok: false, error: "No 'staff' role configured in the system." };
  }

  const department = await prisma.department.findFirst({
    where: { department_name: candidate.department_branch },
    select: { department_id: true },
  });

  try {
    const newUser = await prisma.$transaction(async (tx) => {
      // Ensure unique email — append source_id if the slug collides.
      let email = baseEmail;
      const existing = await tx.users.findUnique({ where: { email } });
      if (existing) email = `${slugifyName(candidate.name)}.${candidate.source_id}@ebrightleads.local`;

      const created = await tx.users.create({
        data: {
          email,
          role_id: staffRole.role_id,
          status: "active",
          user_profile: {
            create: { full_name: candidate.name },
          },
          employment: {
            create: {
              position: candidate.position,
              department_id: department?.department_id,
              start_date: candidate.start_date,
              end_date: candidate.end_date,
              status: candidate.candidate_type === "offboarding" ? "offboarding" : "active",
            },
          },
        },
        select: { user_id: true },
      });

      return created;
    });

    const result = await createInductionRequest(newUser.user_id);

    revalidatePath("/induction/onboarding-dashboard");
    revalidatePath("/induction/hr-dashboard");
    return result;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown database error.";
    return { ok: false, error: `Could not promote candidate: ${msg}` };
  }
}

export async function createBulkInductionRequests(
  userIds: number[],
): Promise<CreateBulkInductionRequestsResult> {
  const auth = await loadActorAndAuthorize();
  if (!auth.ok) return { ok: false, error: auth.error, created: 0, skipped: 0 };

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return { ok: true, created: 0, skipped: 0 };
  }

  let created = 0;
  let skipped = 0;

  for (const userId of userIds) {
    if (!Number.isFinite(userId) || userId <= 0) {
      skipped++;
      continue;
    }

    const target = await prisma.users.findUnique({
      where: { user_id: userId },
      select: { user_id: true },
    });
    if (!target) {
      skipped++;
      continue;
    }

    const existing = await prisma.induction_request.findFirst({
      where: { user_id: userId, status: { not: "completed" } },
      select: { id: true },
    });
    if (existing) {
      skipped++;
      continue;
    }

    try {
      await prisma.induction_request.create({
        data: {
          user_id: userId,
          triggered_by_id: auth.actor.user_id,
          status: "pending",
        },
      });
      created++;
    } catch {
      skipped++;
    }
  }

  if (created > 0) {
    revalidatePath("/induction/control-centre");
    revalidatePath("/induction/hr-dashboard");
    revalidatePath("/induction/hr-dashboard/onboarding-detail");
    revalidatePath("/induction/hr-dashboard/offboarding-detail");
  }

  return { ok: true, created, skipped };
}

export interface AcceptInductionRequestResult {
  ok: boolean;
  error?: string;
  trainingLink?: string;
  inductionProfileId?: number;
  token?: string;
}

export async function acceptInductionRequest(
  requestId: number,
): Promise<AcceptInductionRequestResult> {
  const auth = await loadActorAndAuthorize();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!Number.isFinite(requestId) || requestId <= 0) {
    return { ok: false, error: "Invalid request id." };
  }

  const request = await prisma.induction_request.findUnique({
    where: { id: requestId },
    include: {
      user: {
        include: {
          user_profile: { select: { full_name: true } },
          employment: {
            where: { status: "active" },
            orderBy: { start_date: "desc" },
            take: 1,
          },
        },
      },
    },
  });
  if (!request) return { ok: false, error: "Request not found." };
  if (request.status !== "pending") {
    return { ok: false, error: `Cannot accept a request with status "${request.status}".` };
  }

  const existingProfile = await prisma.induction_profile.findUnique({
    where: { user_id: request.user_id },
    select: { id: true },
  });
  if (existingProfile) {
    return {
      ok: false,
      error:
        "This employee already has an induction profile. Regenerate its link from the profiles table instead.",
    };
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const startDate = request.user.employment[0]?.start_date ?? today;
  const token = randomBytes(64).toString("hex");
  const expiresAt = expiryFromNow();
  const templateName = "Standard";
  const templateSteps = WORKFLOW_TEMPLATES[templateName];

  try {
    const profile = await prisma.$transaction(async (tx) => {
      const created = await tx.induction_profile.create({
        data: {
          user_id: request.user_id,
          induction_type: "Onboarding",
          workflow_template: templateName,
          link_token: token,
          link_expires_at: expiresAt,
          status: "Sent",
          start_date: startDate,
          created_by: auth.actor.user_id,
        },
        select: { id: true },
      });

      await tx.induction_step.createMany({
        data: templateSteps.map((step) => ({
          induction_profile_id: created.id,
          step_number: step.stepNumber,
          title: step.title,
          description: step.description,
          due_date: computeStepDueDate(startDate, step.daysFromStart),
          status: "Pending",
        })),
      });

      await tx.induction_request.update({
        where: { id: requestId },
        data: {
          status: "accepted",
          accepted_at: new Date(),
          induction_profile_id: created.id,
        },
      });

      return created;
    });

    revalidatePath("/induction/control-centre");
    revalidatePath("/dashboards/hrms");

    const baseUrl = process.env.NEXTAUTH_URL ?? "";
    const trainingLink = `${baseUrl}/induction/${token}`;

    console.info(
      "[induction] mock email after accept:",
      JSON.stringify({
        to: request.user.email,
        recipient: request.user.user_profile?.full_name ?? request.user.email,
        token,
        link: trainingLink,
      }),
    );

    return {
      ok: true,
      trainingLink,
      inductionProfileId: profile.id,
      token,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown database error.";
    return { ok: false, error: `Could not accept request: ${msg}` };
  }
}

export interface MarkStepCompleteResult {
  ok: boolean;
  error?: string;
}

/**
 * Token-authenticated action — anyone holding the link may mark steps for that profile.
 * The token must match the step's parent profile, otherwise the call is rejected.
 */
export async function markStepCompleteByToken(
  stepId: number,
  token: string,
): Promise<MarkStepCompleteResult> {
  if (!Number.isFinite(stepId) || stepId <= 0) {
    return { ok: false, error: "Invalid step id." };
  }
  if (!token || typeof token !== "string") {
    return { ok: false, error: "Missing token." };
  }

  const profile = await prisma.induction_profile.findUnique({
    where: { link_token: token },
    select: { id: true, user_id: true, link_expires_at: true, status: true },
  });
  if (!profile) return { ok: false, error: "Invalid or revoked link." };
  if (profile.link_expires_at.getTime() < Date.now()) {
    return { ok: false, error: "This induction link has expired." };
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { ok: false, error: "Please sign in to mark steps complete." };
  }
  const actor = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { user_id: true, role: { select: { role_type: true } } },
  });
  if (!actor) return { ok: false, error: "User record not found." };
  const isManager = canManageInductions(actor.role?.role_type ?? null);
  const isOwner = actor.user_id === profile.user_id;
  if (!isManager && !isOwner) {
    return { ok: false, error: "You are not authorized to mark this step complete." };
  }

  const step = await prisma.induction_step.findUnique({
    where: { id: stepId },
    select: {
      id: true,
      title: true,
      induction_profile_id: true,
      status: true,
      responsible_person: { select: { email: true } },
    },
  });
  if (!step || step.induction_profile_id !== profile.id) {
    return { ok: false, error: "Step does not belong to this induction." };
  }
  if (step.status === "Completed") {
    return { ok: true };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.induction_step.update({
        where: { id: stepId },
        data: {
          status: "Completed",
          completed_at: new Date(),
          completed_by: profile.user_id,
        },
      });

      const remaining = await tx.induction_step.count({
        where: {
          induction_profile_id: profile.id,
          status: { not: "Completed" },
        },
      });

      const nextProfileStatus =
        remaining === 0 ? "Completed" : profile.status === "Created" ? "In Progress" : profile.status === "Sent" ? "In Progress" : profile.status;

      if (nextProfileStatus !== profile.status || remaining === 0) {
        await tx.induction_profile.update({
          where: { id: profile.id },
          data: {
            status: nextProfileStatus,
            completed_at: remaining === 0 ? new Date() : null,
          },
        });
      }

      if (remaining === 0) {
        await tx.induction_request.updateMany({
          where: {
            induction_profile_id: profile.id,
            status: { in: ["accepted", "pending"] },
          },
          data: { status: "completed" },
        });
      }
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown database error.";
    return { ok: false, error: `Could not mark step complete: ${msg}` };
  }

  console.info(
    "[induction] mock notification:",
    JSON.stringify({
      step: step.title,
      stepId: step.id,
      notify: step.responsible_person?.email ?? "(no responsible person assigned)",
    }),
  );

  revalidatePath(`/induction/${token}`);
  revalidatePath("/induction/control-centre");
  return { ok: true };
}

// ============ Slice E: surveys & recommendations ============

export type SurveySubmissionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export async function submitSurveyResponse(
  inductionProfileId: number,
  milestone: string,
  responses: Record<string, string | number>,
): Promise<SurveySubmissionResult> {
  try {
    const template = await prisma.survey_template.findUnique({
      where: { milestone },
    });

    if (!template) {
      return { ok: false, error: "Survey template not found." };
    }

    const numericValues = Object.values(responses).filter(
      (v): v is number => typeof v === "number" && v >= 1 && v <= 5,
    );
    const sentimentScore =
      numericValues.length > 0
        ? Math.round(
            numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
          )
        : null;

    await prisma.survey_response.create({
      data: {
        induction_profile_id: inductionProfileId,
        survey_template_id: template.id,
        responses,
        sentiment_score: sentimentScore,
        submitted_at: new Date(),
      },
    });

    console.info(
      "[induction] survey submitted:",
      JSON.stringify({ inductionProfileId, milestone, score: sentimentScore }),
    );

    return { ok: true, message: "Survey submitted." };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `Failed to submit survey: ${msg}` };
  }
}

export type RecommendationStatus =
  | "New"
  | "In Progress"
  | "Implemented"
  | "Verified";

export async function updateRecommendationStatus(
  recommendationId: number,
  newStatus: RecommendationStatus,
): Promise<void> {
  const auth = await loadActorAndAuthorize();
  if (!auth.ok) return;

  await prisma.recommendation.update({
    where: { id: recommendationId },
    data: {
      status: newStatus,
      completed_at: newStatus === "Verified" ? new Date() : null,
    },
  });

  revalidatePath("/induction/feedback-analytics");
}
