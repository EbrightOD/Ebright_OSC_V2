/**
 * Spec-defined Day 1/2/3 task lists for the HR candidate detail view's
 * Day Tabs Checklist.
 *
 * These are the EXPECTED tasks per employee type per spec v2. The DB's
 * actual induction_step rows may differ (they come from the workflow
 * template assigned at createInduction). When displaying the checklist,
 * we fall back to spec tasks if no DB step matches.
 *
 * // TODO: align induction_step seeding with this spec or add an
 * //       actor_type column to induction_step so this hardcoded mapping
 * //       can be retired.
 */

export type ActorType = "Candidate" | "HR" | "Full-time Coach";

export interface SpecTask {
  title: string;
  actor: ActorType;
}

export type EmployeeTypeKey =
  | "regular-intern"
  | "protege-intern"
  | "coach-part"
  | "coach-full"
  | "fulltime-hq";

export interface EmployeeTypeMeta {
  key: EmployeeTypeKey;
  label: string;
  workflowTemplateKey: string; // matches induction_profile.workflow_template
  /** Whether this type triggers the 3-Week Branch Onboarding after Day 3. */
  hasBranchOnboarding: boolean;
  /** Whether this type triggers the Department Workflow after Day 3. */
  hasDepartmentWorkflow: boolean;
}

export const EMPLOYEE_TYPES: EmployeeTypeMeta[] = [
  { key: "regular-intern",  label: "Regular Intern",     workflowTemplateKey: "Standard",            hasBranchOnboarding: false, hasDepartmentWorkflow: true },
  { key: "protege-intern",  label: "Protege Intern",     workflowTemplateKey: "ProtegeInternBranch", hasBranchOnboarding: true,  hasDepartmentWorkflow: false },
  { key: "coach-part",      label: "Coach (Part-timer)", workflowTemplateKey: "CoachPartTimer",      hasBranchOnboarding: false, hasDepartmentWorkflow: true },
  { key: "coach-full",      label: "Coach (Full-timer)", workflowTemplateKey: "CoachFullTimer",      hasBranchOnboarding: true,  hasDepartmentWorkflow: false },
  { key: "fulltime-hq",     label: "Full-timer (HQ)",    workflowTemplateKey: "FullTimer",           hasBranchOnboarding: false, hasDepartmentWorkflow: true },
];

/** Find the employee type metadata that matches a workflow_template string. */
export function typeForWorkflowTemplate(workflowTemplate: string): EmployeeTypeMeta {
  return (
    EMPLOYEE_TYPES.find((t) => t.workflowTemplateKey === workflowTemplate) ??
    EMPLOYEE_TYPES[0] // safe fallback to Regular Intern
  );
}

// Day 1 — same for ALL employee types
export const DAY1_TASKS: SpecTask[] = [
  { title: "eBright Portal Onboarding", actor: "Candidate" },
  { title: "Day 1 Induction Training", actor: "Candidate" },
  { title: "Confirm Attendance & Brief Day 2", actor: "HR" },
];

// Day 2 — split by employee type
export const DAY2_TASKS: Record<EmployeeTypeKey, SpecTask[]> = {
  "regular-intern": [
    { title: "Attendance Report", actor: "Candidate" },
    { title: "Day 2 Video", actor: "Candidate" },
    { title: "Library", actor: "Candidate" },
    { title: "Autocount Payroll", actor: "Candidate" },
    { title: "Process Street", actor: "Candidate" },
    { title: "Logsheet", actor: "Candidate" },
    { title: "WhatsApp Groups", actor: "Candidate" },
    { title: "Zoom", actor: "Candidate" },
    { title: "ClickUp", actor: "Candidate" },
  ],
  "protege-intern": [
    { title: "Travel to Assigned Branch", actor: "Candidate" },
    { title: "Attendance Report at Branch", actor: "Candidate" },
    { title: "Day 2 Video", actor: "Candidate" },
    { title: "Branch Orientation", actor: "Full-time Coach" },
    { title: "System Access at Branch", actor: "Candidate" },
    { title: "Logsheet", actor: "Candidate" },
    { title: "WhatsApp Groups", actor: "Candidate" },
    { title: "Zoom", actor: "Candidate" },
    { title: "ClickUp", actor: "Candidate" },
  ],
  "coach-part": [
    { title: "Travel to Assigned Branch", actor: "Candidate" },
    { title: "Attendance Report at Branch", actor: "Candidate" },
    { title: "Day 2 Video", actor: "Candidate" },
    { title: "Meet Full-time Coach and Branch Manager", actor: "Full-time Coach" },
    { title: "Branch Induction", actor: "Full-time Coach" },
    { title: "WhatsApp Groups", actor: "Candidate" },
    { title: "Zoom", actor: "Candidate" },
    { title: "ClickUp", actor: "Candidate" },
  ],
  "coach-full": [
    { title: "Travel to Assigned Branch", actor: "Candidate" },
    { title: "Attendance Report at Branch", actor: "Candidate" },
    { title: "Day 2 Video", actor: "Candidate" },
    { title: "Meet Branch Manager", actor: "Full-time Coach" },
    { title: "Branch Orientation", actor: "Full-time Coach" },
    { title: "WhatsApp Groups", actor: "Candidate" },
    { title: "ClickUp", actor: "Candidate" },
  ],
  "fulltime-hq": [
    { title: "Report to HQ or Assigned Branch", actor: "Candidate" },
    { title: "Attendance Report", actor: "Candidate" },
    { title: "Day 2 Video", actor: "Candidate" },
    { title: "System Access Setup", actor: "HR" },
    { title: "Process Street", actor: "Candidate" },
    { title: "WhatsApp Groups", actor: "Candidate" },
    { title: "Zoom", actor: "Candidate" },
    { title: "ClickUp", actor: "Candidate" },
  ],
};

// Day 3 — split by employee type
export const DAY3_TASKS: Record<EmployeeTypeKey, SpecTask[]> = {
  "regular-intern": [
    { title: "Attendance Report", actor: "Candidate" },
    { title: "Train with Your Trainer", actor: "Candidate" },
    { title: "Department Training", actor: "HR" },
    { title: "Day 3 Video", actor: "Candidate" },
  ],
  "protege-intern": [
    { title: "Attendance Report at Branch", actor: "Candidate" },
    { title: "Train with Full-time Coach", actor: "Full-time Coach" },
    { title: "Day 3 Video", actor: "Candidate" },
    // Final candidate-actor task — ticking this completes Day 3 and
    // unlocks the 3-Week Branch Onboarding section below the day tabs.
    { title: "Start onboarding training", actor: "Candidate" },
  ],
  "coach-part": [
    { title: "Attendance Report", actor: "Candidate" },
    { title: "Train with Your Trainer", actor: "Candidate" },
    { title: "Department Training", actor: "HR" },
    { title: "Day 3 Video", actor: "Candidate" },
  ],
  "coach-full": [
    { title: "Attendance Report at Branch", actor: "Candidate" },
    { title: "Meet Branch Manager", actor: "Full-time Coach" },
    { title: "Day 3 Video", actor: "Candidate" },
    // Final candidate-actor task — ticking this completes Day 3 and
    // unlocks the 3-Week Branch Onboarding section below the day tabs.
    { title: "Start onboarding training", actor: "Candidate" },
  ],
  "fulltime-hq": [
    { title: "Attendance Report", actor: "Candidate" },
    { title: "Train with Your Trainer", actor: "Candidate" },
    { title: "Department Training", actor: "HR" },
    { title: "Day 3 Video", actor: "Candidate" },
  ],
};

// 3-Week Branch Onboarding tasks — same for Protege Intern + Coach (Full-timer)
export const BRANCH_WEEK_TASKS: Record<1 | 2 | 3, SpecTask[]> = {
  1: [
    { title: "Branch Welcome & Orientation", actor: "Full-time Coach" },
    { title: "System Access & Tools Setup", actor: "Full-time Coach" },
    { title: "Observe Daily Operations", actor: "Candidate" },
    { title: "Shadow Full-time Coach — Classes", actor: "Candidate" },
    { title: "Week 1 Logsheet Submission", actor: "Candidate" },
  ],
  2: [
    { title: "Assist in Live Classes (supervised)", actor: "Full-time Coach" },
    { title: "Conduct Solo Class (1 session)", actor: "Candidate" },
    { title: "Branch KPI Review — Week 1", actor: "Full-time Coach" },
    { title: "Week 2 Logsheet Submission", actor: "Candidate" },
  ],
  3: [
    { title: "Conduct Full Week of Classes", actor: "Candidate" },
    { title: "Branch Assessment by Manager", actor: "Full-time Coach" },
    { title: "Final Logsheet Submission", actor: "Candidate" },
    { title: "Completion Sign-off by Branch Manager", actor: "Full-time Coach" },
  ],
};
