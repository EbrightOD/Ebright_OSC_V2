export interface WorkflowStepTemplate {
  stepNumber: number;
  title: string;
  description: string;
  daysFromStart: number;
}

export const WORKFLOW_TEMPLATES: Record<string, readonly WorkflowStepTemplate[]> = {
  Standard: [
    { stepNumber: 1,  title: "Pre-Onboarding Checklist",        description: "Complete pre-arrival paperwork and confirm logistics.", daysFromStart: -2 },
    { stepNumber: 2,  title: "Welcome & Orientation",           description: "Attend the company welcome session.",                   daysFromStart: 0 },
    { stepNumber: 3,  title: "IT Equipment Setup",              description: "Receive and configure laptop, phone, and peripherals.", daysFromStart: 0 },
    { stepNumber: 4,  title: "System Access Provisioning",      description: "Set up email, SSO, VPN, and required tooling.",         daysFromStart: 0 },
    { stepNumber: 5,  title: "Compliance & Security Training",  description: "Complete mandatory compliance and security modules.",   daysFromStart: 1 },
    { stepNumber: 6,  title: "Company Policies Review",         description: "Read and acknowledge core company policies.",           daysFromStart: 1 },
    { stepNumber: 7,  title: "Team Introduction",               description: "Meet your immediate team members.",                     daysFromStart: 1 },
    { stepNumber: 8,  title: "Department Overview",             description: "Learn how your department operates.",                   daysFromStart: 2 },
    { stepNumber: 9,  title: "Role-Specific Training",          description: "Begin training tailored to your role.",                 daysFromStart: 3 },
    { stepNumber: 10, title: "Mentorship Assignment",           description: "Meet your assigned buddy or mentor.",                   daysFromStart: 4 },
    { stepNumber: 11, title: "First Week Goals",                description: "Agree first-week objectives with your manager.",        daysFromStart: 5 },
    { stepNumber: 12, title: "Onboarding Complete",             description: "Final check-in with HR.",                               daysFromStart: 7 },
  ],
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
