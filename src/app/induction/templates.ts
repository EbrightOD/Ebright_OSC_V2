export interface WorkflowStepTemplate {
  stepNumber: number;
  title: string;
  description: string;
  daysFromStart: number;
}

// ============================================================
// Composable building blocks for the 4 employee-type templates.
// Day 1 is identical for everyone; Day 2 splits 4 ways by type;
// Day 3 splits between standard (interns + full-timers) and the
// extended Coach 3-week branch training.
// ============================================================

type StepDef = Omit<WorkflowStepTemplate, "stepNumber">;

// Day 1 — Common path for all employees (5 steps)
const DAY1_COMMON: readonly StepDef[] = [
  { title: "eBright Portal Onboarding",         description: "Portal registration and profile setup completed before Day 1 (Candidate).",                  daysFromStart: -1 },
  { title: "Day 1 Induction Training",          description: "Full induction held at HQ — same for all types (Candidate).",                                 daysFromStart:  0 },
  { title: "Confirm Attendance & Brief Day 2",  description: "Confirm attendance · brief each candidate on Day 2 · verify branch or HQ assignment (HR).",   daysFromStart:  0 },
];

// Day 2 — Regular Intern at HQ
const DAY2_REGULAR_INTERN_HQ: readonly StepDef[] = [
  { title: "Attendance Report (HQ)",            description: "Photo at HQ reception · 8:45 · submit as proof.",                              daysFromStart: 1 },
  { title: "Day 2 Video",                       description: "Record based on question and submit.",                                          daysFromStart: 1 },
  { title: "Library",                           description: "Learn what it is used for and how to find resources.",                          daysFromStart: 1 },
  { title: "Autocount Payroll",                 description: "Log in · learn to submit a claim.",                                             daysFromStart: 1 },
  { title: "Process Street",                    description: "Create and run a workflow.",                                                    daysFromStart: 1 },
  { title: "Logsheet",                          description: "Get link · write daily report · update intern WhatsApp.",                       daysFromStart: 1 },
  { title: "WhatsApp Groups",                   description: "Verify all required groups.",                                                   daysFromStart: 1 },
  { title: "Zoom Setup",                        description: "Log in with company email · screenshot.",                                       daysFromStart: 1 },
  { title: "ClickUp Update",                    description: "Update task completion · screenshot in group.",                                 daysFromStart: 1 },
];

// Day 2 — Protege Intern at Assigned Branch
const DAY2_PROTEGE_INTERN_BRANCH: readonly StepDef[] = [
  { title: "Travel to Assigned Branch",         description: "Report to your designated branch location.",                                    daysFromStart: 1 },
  { title: "Attendance Report at Branch",       description: "Photo at branch · 8:45 · submit as proof.",                                     daysFromStart: 1 },
  { title: "Day 2 Video",                       description: "Record based on question and submit.",                                          daysFromStart: 1 },
  { title: "Branch Orientation",                description: "Familiarise with branch layout, team and setup.",                               daysFromStart: 1 },
  { title: "System Access at Branch",           description: "Library · Autocount · Process Street — log in and explore.",                    daysFromStart: 1 },
  { title: "Logsheet",                          description: "Get link · write daily report · update intern WhatsApp.",                       daysFromStart: 1 },
  { title: "WhatsApp Groups",                   description: "Verify all required groups.",                                                   daysFromStart: 1 },
  { title: "Zoom Setup",                        description: "Log in with company email · screenshot.",                                       daysFromStart: 1 },
  { title: "ClickUp Update",                    description: "Update task completion · screenshot in group.",                                 daysFromStart: 1 },
];

// Day 2 — Coach (Part-timer) at Assigned Branch
const DAY2_COACH_PART_TIMER: readonly StepDef[] = [
  { title: "Travel to Assigned Branch",         description: "Go independently to your assigned branch.",                                     daysFromStart: 1 },
  { title: "Attendance Report at Branch",       description: "Photo at branch · 8:45 · submit as proof.",                                     daysFromStart: 1 },
  { title: "Day 2 Video",                       description: "Record based on question and submit.",                                          daysFromStart: 1 },
  { title: "Meet Full-time Coach & Branch Manager", description: "Introduction · briefing on branch operations and expectations.",            daysFromStart: 1 },
  { title: "Branch Induction",                  description: "Guided by full-time coach through branch systems and workflow.",                 daysFromStart: 1 },
  { title: "WhatsApp Groups",                   description: "Verify all required groups.",                                                   daysFromStart: 1 },
  { title: "Zoom Setup",                        description: "Log in with company email · screenshot.",                                       daysFromStart: 1 },
  { title: "ClickUp Update",                    description: "Update task completion · screenshot in group.",                                 daysFromStart: 1 },
];

// Day 2 — Full-timer at HQ or Assigned Branch (per role)
const DAY2_FULL_TIMER: readonly StepDef[] = [
  { title: "Report to HQ or Assigned Branch",   description: "Based on your department and role assignment.",                                 daysFromStart: 1 },
  { title: "Attendance Report",                 description: "Photo at location · 8:45 · submit as proof.",                                   daysFromStart: 1 },
  { title: "Day 2 Video",                       description: "Record based on question and submit.",                                          daysFromStart: 1 },
  { title: "System Access Setup",               description: "Library · Autocount · Process Street — log in and explore.",                    daysFromStart: 1 },
  { title: "Process Street",                    description: "Create and run a workflow.",                                                    daysFromStart: 1 },
  { title: "WhatsApp Groups",                   description: "Verify all required groups.",                                                   daysFromStart: 1 },
  { title: "Zoom Setup",                        description: "Log in with company email · screenshot.",                                       daysFromStart: 1 },
  { title: "ClickUp Update",                    description: "Update task completion · screenshot in group.",                                 daysFromStart: 1 },
];

// Day 3 — Standard close (Regular Intern, Protege Intern, Full-timer)
const DAY3_STANDARD: readonly StepDef[] = [
  { title: "Attendance Report (Day 3)",         description: "Photo at location · 8:45 · submit as proof.",                                   daysFromStart: 2 },
  { title: "Train with Your Trainer",           description: "Complete scheduled training session with assigned trainer.",                     daysFromStart: 2 },
  { title: "Department Training",               description: "Own department workflow — to be added per department (placeholder).",           daysFromStart: 2 },
  { title: "Day 3 Video",                       description: "Record based on question and submit.",                                          daysFromStart: 2 },
];

// Day 3+ — Coach (Part-timer): 3-day induction + 3-week branch training
const DAY3_COACH: readonly StepDef[] = [
  { title: "Attendance Report at Branch (Day 3)", description: "Photo at branch · 8:45 · submit as proof.",                                   daysFromStart: 2 },
  { title: "Train with Full-time Coach",        description: "Day 3 session — guided at assigned branch (Full-time Coach).",                  daysFromStart: 2 },
  { title: "Day 3 Video",                       description: "Record based on question and submit.",                                          daysFromStart: 2 },
  { title: "3-Week Branch Training",            description: "Daily at assigned branch · guided by full-time coach or branch manager.",       daysFromStart: 2 },
  { title: "HQ Visit Days",                     description: "1–2 days per week at HQ · guided by full-time coach or branch manager.",        daysFromStart: 2 },
];

function buildTemplate(
  ...parts: ReadonlyArray<readonly StepDef[]>
): readonly WorkflowStepTemplate[] {
  const out: WorkflowStepTemplate[] = [];
  let n = 1;
  for (const part of parts) {
    for (const s of part) {
      out.push({ stepNumber: n++, ...s });
    }
  }
  return out;
}

export const WORKFLOW_TEMPLATES: Record<string, readonly WorkflowStepTemplate[]> = {
  // "Standard" is kept as the default key (= Regular Intern @ HQ) so existing
  // call sites that hardcode "Standard" continue to work without churn.
  Standard:               buildTemplate(DAY1_COMMON, DAY2_REGULAR_INTERN_HQ,    DAY3_STANDARD),
  ProtegeInternBranch:    buildTemplate(DAY1_COMMON, DAY2_PROTEGE_INTERN_BRANCH, DAY3_STANDARD),
  CoachPartTimer:         buildTemplate(DAY1_COMMON, DAY2_COACH_PART_TIMER,      DAY3_COACH),
  // Coach (Full-timer): same 3-day induction shape as Part-timer; the
  // distinguishing 3-week branch program is rendered separately on the
  // HR candidate detail view (BranchOnboardingSection) and gated by the
  // hasBranchOnboarding flag in induction-task-spec.ts.
  CoachFullTimer:         buildTemplate(DAY1_COMMON, DAY2_COACH_PART_TIMER,      DAY3_COACH),
  FullTimer:              buildTemplate(DAY1_COMMON, DAY2_FULL_TIMER,            DAY3_STANDARD),
  "IT-Heavy": [
    { stepNumber: 1, title: "IT Equipment Setup",     description: "Receive laptop, phone, and other equipment.",        daysFromStart: 0 },
    { stepNumber: 2, title: "VPN & Network Setup",    description: "Configure VPN and network access.",                  daysFromStart: 0 },
    { stepNumber: 3, title: "Compliance Training",    description: "Complete mandatory compliance modules.",             daysFromStart: 1 },
    { stepNumber: 4, title: "Team Introduction",      description: "Meet your team members.",                            daysFromStart: 1 },
    { stepNumber: 5, title: "Security Briefing",      description: "Learn about security protocols.",                    daysFromStart: 2 },
    { stepNumber: 6, title: "Buddy Meeting",          description: "Connect with your induction buddy.",                 daysFromStart: 2 },
    { stepNumber: 7, title: "Project Overview",       description: "Learn about current projects.",                      daysFromStart: 3 },
    { stepNumber: 8, title: "Tools & Access Setup",   description: "Set up development tools and access.",               daysFromStart: 4 },
    { stepNumber: 9, title: "Documentation Review",   description: "Review technical documentation.",                    daysFromStart: 5 },
    { stepNumber: 10, title: "Welcome Call",          description: "Final check-in with HR.",                            daysFromStart: 7 },
  ],
  Remote: [
    { stepNumber: 1, title: "Equipment Delivery & Setup", description: "Receive home office equipment.",                 daysFromStart: -2 },
    { stepNumber: 2, title: "Compliance Training",        description: "Complete mandatory compliance modules.",         daysFromStart: 0 },
    { stepNumber: 3, title: "Virtual Team Introduction",  description: "Meet your team members via video.",              daysFromStart: 1 },
    { stepNumber: 4, title: "Buddy Meeting",              description: "Virtual coffee with your induction buddy.",      daysFromStart: 2 },
    { stepNumber: 5, title: "Project Overview",           description: "Learn about current projects.",                  daysFromStart: 3 },
    { stepNumber: 6, title: "Tools & Access Setup",       description: "Set up work tools and system access.",           daysFromStart: 4 },
    { stepNumber: 7, title: "Documentation Review",       description: "Review remote work guidelines and policies.",    daysFromStart: 5 },
    { stepNumber: 8, title: "Welcome Call",               description: "Final check-in with HR.",                        daysFromStart: 7 },
  ],
};

export const OFFBOARDING_WORKFLOW: readonly WorkflowStepTemplate[] = [
  { stepNumber: 1,  title: "Exit Interview Scheduled",      description: "Book the exit interview with HR.",                                daysFromStart: 0 },
  { stepNumber: 2,  title: "Knowledge Transfer Planning",   description: "Identify recipients and outline the handover.",                   daysFromStart: 1 },
  { stepNumber: 3,  title: "Project Handover",              description: "Transfer active projects to remaining team members.",             daysFromStart: 3 },
  { stepNumber: 4,  title: "Documentation Review",          description: "Update internal docs, runbooks, and access notes.",               daysFromStart: 5 },
  { stepNumber: 5,  title: "Access Deprovisioning",         description: "Revoke logins, SSO, VPN, and admin permissions.",                 daysFromStart: 6 },
  { stepNumber: 6,  title: "Equipment Return",              description: "Return laptop, phone, access cards, and other assets.",           daysFromStart: 7 },
  { stepNumber: 7,  title: "Final Expense Review",          description: "Submit and reconcile any outstanding expense claims.",            daysFromStart: 7 },
  { stepNumber: 8,  title: "Offboarding Interview",         description: "Meet with HR to share feedback and improvements.",                daysFromStart: 8 },
  { stepNumber: 9,  title: "Reference Check Setup",         description: "Confirm reference contact preferences for future requests.",      daysFromStart: 9 },
  { stepNumber: 10, title: "Exit Clearance",                description: "Sign off all department clearances.",                             daysFromStart: 10 },
  { stepNumber: 11, title: "Final Paycheck Verification",   description: "Verify final salary, leave balance, and benefits payout.",        daysFromStart: 11 },
  { stepNumber: 12, title: "Offboarding Complete",          description: "Farewell and final acknowledgement.",                             daysFromStart: 14 },
];

export const WORKFLOW_TEMPLATE_NAMES = Object.keys(WORKFLOW_TEMPLATES);

// Human-readable labels for the workflow keys, surfaced in HR forms.
// Key not present here? The form falls back to the raw key.
export const WORKFLOW_TEMPLATE_LABELS: Record<string, string> = {
  Standard:            "Regular Intern · HQ",
  ProtegeInternBranch: "Protege Intern · Branch",
  CoachPartTimer:      "Coach (Part-timer) · Branch + 3-week training",
  CoachFullTimer:      "Coach (Full-timer) · Branch + 3-week training",
  FullTimer:           "Full-timer · HQ or Branch",
  "IT-Heavy":          "IT-Heavy (legacy)",
  Remote:              "Remote (legacy)",
};

export function workflowTemplateLabel(name: string): string {
  return WORKFLOW_TEMPLATE_LABELS[name] ?? name;
}

// Default induction duration per template (in days). Coaches get the
// extended 3-day induction + 3-week branch training (~21 calendar days).
// Everyone else completes within 3 days. HR can override per employee on
// induction_profile.target_duration_days.
const DEFAULT_DURATION_DAYS: Record<string, number> = {
  Standard:               3,   // Regular Intern · HQ
  ProtegeInternBranch:    3,
  CoachPartTimer:        21,
  CoachFullTimer:        21,   // matches the "3-week training" label + part-timer
  FullTimer:              3,
  "IT-Heavy":             7,
  Remote:                 7,
};

export function defaultDurationDays(templateKey: string): number {
  return DEFAULT_DURATION_DAYS[templateKey] ?? 3;
}

export function isKnownTemplate(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(WORKFLOW_TEMPLATES, name);
}

export function computeStepDueDate(startDate: Date, daysOffset: number): Date {
  const d = new Date(startDate);
  d.setUTCDate(d.getUTCDate() + daysOffset);
  return d;
}

export type SurveyMilestone = "Day1" | "Week2" | "Month1" | "Month3";

export type SurveyQuestionType = "emoji" | "text" | "scale" | "multiple_choice";

export interface SurveyQuestion {
  id: string;
  text: string;
  type: SurveyQuestionType;
  options?: ReadonlyArray<string | number>;
}

export interface SurveyTemplate {
  milestone: SurveyMilestone;
  questions: ReadonlyArray<SurveyQuestion>;
}

export const SURVEY_TEMPLATES: Record<SurveyMilestone, SurveyTemplate> = {
  Day1: {
    milestone: "Day1",
    questions: [
      {
        id: "day1_overall",
        text: "How's your first day?",
        type: "emoji",
        options: ["😞", "😐", "😊"],
      },
      {
        id: "day1_word",
        text: "One word to describe today:",
        type: "text",
      },
    ],
  },
  Week2: {
    milestone: "Week2",
    questions: [
      { id: "week2_confidence", text: "Confidence in your role", type: "scale", options: [1, 2, 3, 4, 5] },
      { id: "week2_clarity", text: "Clarity of expectations", type: "scale", options: [1, 2, 3, 4, 5] },
      { id: "week2_training", text: "Quality of training", type: "scale", options: [1, 2, 3, 4, 5] },
      { id: "week2_manager", text: "Manager support", type: "scale", options: [1, 2, 3, 4, 5] },
      { id: "week2_recommend", text: "Would recommend to a friend?", type: "multiple_choice", options: ["Yes", "No"] },
    ],
  },
  Month1: {
    milestone: "Month1",
    questions: [
      { id: "month1_ready", text: "Ready to go solo?", type: "scale", options: [1, 2, 3, 4, 5] },
      { id: "month1_satisfaction", text: "Overall satisfaction", type: "scale", options: [1, 2, 3, 4, 5] },
    ],
  },
  Month3: {
    milestone: "Month3",
    questions: [
      { id: "m3_overall", text: "Overall experience", type: "scale", options: [1, 2, 3, 4, 5] },
      { id: "m3_stay", text: "Likelihood to stay", type: "scale", options: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
    ],
  },
};
