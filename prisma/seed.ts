import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";

const prisma = new PrismaClient();

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
  "IT-Heavy": [
    { title: "IT Equipment Setup", description: "Receive laptop, phone, and other equipment", daysFromStart: 0 },
    { title: "VPN & Network Setup", description: "Configure VPN and network access", daysFromStart: 0 },
    { title: "Compliance Training", description: "Complete mandatory compliance modules", daysFromStart: 1 },
    { title: "Team Introduction", description: "Meet your team members", daysFromStart: 1 },
    { title: "Security Briefing", description: "Learn about security protocols", daysFromStart: 2 },
    { title: "Buddy Meeting", description: "Connect with your induction buddy", daysFromStart: 2 },
    { title: "Project Overview", description: "Learn about current projects", daysFromStart: 3 },
    { title: "Tools & Access Setup", description: "Set up development tools and access", daysFromStart: 4 },
    { title: "Documentation Review", description: "Review technical documentation", daysFromStart: 5 },
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

async function main() {
  console.log("🌱 Seeding induction mock data...");

  // Get all active users (to assign as employees and buddies)
  const users = await prisma.users.findMany({
    where: { status: "active" },
    select: { user_id: true, email: true, user_profile: { select: { full_name: true } } },
    take: 10,
  });

  if (users.length < 6) {
    console.log("⚠️  Need at least 6 active users to seed. Skipping.");
    return;
  }

  // Get an HR/superadmin user to be the creator
  const creator = await prisma.users.findFirst({
    where: { role: { role_type: { in: ["superadmin", "hr"] } }, status: "active" },
    select: { user_id: true },
  });

  if (!creator) {
    console.log("⚠️  No superadmin/hr user found. Skipping.");
    return;
  }

  // Delete existing mock data (safe for test)
  await prisma.induction_step.deleteMany({});
  await prisma.induction_profile.deleteMany({});
  console.log("✓ Cleared existing induction data");

  // Create 5 mock profiles
  const mockProfiles = [
    {
      employeeIndex: 0,
      inductionType: "Onboarding",
      template: "Standard",
      startDaysFromNow: 0,
      buddyIndex: 1,
      statusProgression: [0, 1, 3, 5, 7], // Indices of steps to mark complete
    },
    {
      employeeIndex: 1,
      inductionType: "Onboarding",
      template: "IT-Heavy",
      startDaysFromNow: -5,
      buddyIndex: 2,
      statusProgression: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], // All complete
    },
    {
      employeeIndex: 2,
      inductionType: "Onboarding",
      template: "Standard",
      startDaysFromNow: 3,
      buddyIndex: null,
      statusProgression: [0], // Just first step
    },
    {
      employeeIndex: 3,
      inductionType: "Offboarding",
      template: "Standard",
      startDaysFromNow: -10,
      buddyIndex: null,
      statusProgression: [0, 1, 2, 3, 4], // Halfway through
    },
    {
      employeeIndex: 4,
      inductionType: "Onboarding",
      template: "Standard",
      startDaysFromNow: 7,
      buddyIndex: 5,
      statusProgression: [], // Not started
    },
  ];

  for (const profile of mockProfiles) {
    const employee = users[profile.employeeIndex];
    const buddy = profile.buddyIndex !== null ? users[profile.buddyIndex] : null;
    const startDate = dateAdd(new Date(), profile.startDaysFromNow);
    const token = generateToken();
    const expiresAt = dateAdd(new Date(), 30);

    const templateSteps = WORKFLOW_STEPS[profile.template as keyof typeof WORKFLOW_STEPS];

    const created = await prisma.induction_profile.create({
      data: {
        user_id: employee.user_id,
        induction_type: profile.inductionType,
        workflow_template: profile.template,
        buddy_user_id: buddy?.user_id ?? null,
        link_token: token,
        link_expires_at: expiresAt,
        status: profile.statusProgression.length === 0 ? "Created" : "In Progress",
        start_date: startDate,
        exit_date: profile.inductionType === "Offboarding" ? dateAdd(startDate, 14) : null,
        created_by: creator.user_id,
      },
    });

    // Create steps
    const steps = await Promise.all(
      templateSteps.map((step, idx) => {
        const dueDate = dateAdd(startDate, step.daysFromStart);
        const isCompleted = profile.statusProgression.includes(idx);
        const completedAt = isCompleted ? dateAdd(dueDate, -1) : null;

        return prisma.induction_step.create({
          data: {
            induction_profile_id: created.id,
            step_number: idx + 1,
            title: step.title,
            description: step.description,
            due_date: dueDate,
            status: isCompleted ? "Completed" : idx === 0 && profile.statusProgression.length > 0 ? "In Progress" : "Pending",
            completed_at: completedAt,
            completed_by: isCompleted ? employee.user_id : null,
            responsible_user_id: null,
          },
        });
      })
    );

    console.log(`✓ Created induction for ${employee.email} (${profile.template}, ${profile.inductionType})`);
    console.log(`  Link: /induction/${token}`);
    console.log(`  Steps: ${steps.length}, Completed: ${profile.statusProgression.length}`);
  }

  console.log("\n✅ Seed complete! Mock data ready to test.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
