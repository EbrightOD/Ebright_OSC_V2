import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { prisma } from "@/lib/prisma";
import { canManageInductions } from "@/app/induction/roles";
import { randomBytes } from "node:crypto";

const WORKFLOW_STEPS = {
  Standard: [
    { title: "IT Equipment Setup", description: "Receive laptop, phone, and other equipment", daysFromStart: 0 },
    { title: "Compliance Training", description: "Complete mandatory compliance modules", daysFromStart: 1 },
    { title: "Team Introduction", description: "Meet your team members", daysFromStart: 1 },
    { title: "Buddy Meeting", description: "Connect with your induction buddy", daysFromStart: 2 },
    { title: "Project Overview", description: "Learn about current projects", daysFromStart: 3 },
    { title: "Tools & Access Setup", description: "Set up work tools and system access", daysFromStart: 4 },
    { title: "Documentation Review", description: "Review company documentation and policies", daysFromStart: 5 },
    { title: "Welcome Call", description: "Final check-in with HR", daysFromStart: 7 },
  ],
};

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

function dateAdd(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export async function POST() {
  // ⚠️ Dev-only endpoint — disabled in production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const actor = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { user_id: true, role: { select: { role_type: true } } },
    });

    if (!canManageInductions(actor?.role?.role_type ?? null)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get users
    const users = await prisma.users.findMany({
      where: { status: "active" },
      select: { user_id: true, email: true },
      take: 10,
    });

    if (users.length < 2) {
      return NextResponse.json({ error: "Need at least 2 active users" }, { status: 400 });
    }

    // Delete existing mock data
    await prisma.induction_step.deleteMany({});
    await prisma.induction_profile.deleteMany({});

    // Create 1 test profile with 8 steps, some completed
    const employee = users[0];
    const startDate = new Date();
    const token = generateToken();
    const expiresAt = dateAdd(startDate, 30);

    const profile = await prisma.induction_profile.create({
      data: {
        user_id: employee.user_id,
        induction_type: "Onboarding",
        workflow_template: "Standard",
        buddy_user_id: users.length > 1 ? users[1].user_id : null,
        link_token: token,
        link_expires_at: expiresAt,
        status: "In Progress",
        start_date: startDate,
        created_by: actor!.user_id,
      },
    });

    // Create steps (3 completed, 5 pending)
    const templateSteps = WORKFLOW_STEPS.Standard;
    const completedCount = 3;

    await Promise.all(
      templateSteps.map((step, idx) => {
        const dueDate = dateAdd(startDate, step.daysFromStart);
        const isCompleted = idx < completedCount;

        return prisma.induction_step.create({
          data: {
            induction_profile_id: profile.id,
            step_number: idx + 1,
            title: step.title,
            description: step.description,
            due_date: dueDate,
            status: isCompleted ? "Completed" : "Pending",
            completed_at: isCompleted ? dateAdd(dueDate, -1) : null,
            completed_by: isCompleted ? employee.user_id : null,
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      message: "Mock data created successfully",
      profile: {
        id: profile.id,
        employee: employee.email,
        token,
        link: `/induction/${token}`,
        stepsCreated: templateSteps.length,
        stepsCompleted: completedCount,
      },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Failed to create mock data" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "POST to this endpoint to generate mock induction data (superadmin/hr only)",
  });
}
