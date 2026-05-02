# HRMS Induction Training System - Complete Build Prompt

**Status:** Ready to Build (All 5 Slices + 3 Bonuses)  
**Scope:** Full Feature Set  
**Stack:** Next.js 16.2.4 + Prisma 7 + PostgreSQL + NextAuth

---

## CONTEXT: What Already Exists

**Slice A (✅ DONE):**
- Prisma schema: `induction_profile`, `induction_step` models
- Routes: `/induction/control-centre`, `/induction/[token]`
- Server actions: `createInduction`, `markStepCompleteByToken`, `regenerateInductionToken`
- Components: Control centre table, create form, personal link view
- Database: Already migrated (`npx prisma db push` completed)

**You're Starting Here:**
- Slice A is working and tested
- Database is ready
- Now build Slices B, C, D, E + 3 bonuses in parallel

---

## COMPLETE SPECIFICATION

### SLICE B: HR Dashboard 7-Day Triggers

**Purpose:** Auto-detect employees joining in next 7 days, send quick setup alerts.

**Routes:**
- `GET /induction/hr-dashboard` — Server component, HR/superadmin only

**Database:**
- No schema changes. Uses existing: `users`, `employment`, `user_profile`

**Queries to Add** (in `src/app/induction/queries.ts`):

```typescript
export interface UpcomingHireRow {
  userId: number;
  email: string;
  fullName: string;
  departmentName: string;
  joinDate: string; // ISO
  daysUntilJoin: number;
  hasInductionProfile: boolean;
  inductionStatus?: "Created" | "Sent" | "In Progress";
}

export async function listEmployeesJoiningInNext7Days(): Promise<UpcomingHireRow[]> {
  // Query employees with join_date between today and +7 days
  // Order by urgency (today first)
  // Check if induction_profile already exists
  // Return array of upcoming hires
}
```

**Server Actions to Add** (in `src/app/induction/actions.ts`):

```typescript
export async function quickGenerateLinkFromDashboard(
  userId: number,
  buddyUserId?: number,
  daysOffset?: number
): Promise<{
  success: boolean;
  link: string;
  token: string;
  message: string;
}> {
  // Shortcut to createInduction for quick setup from HR Dashboard
  // Auto-fill: employee, department, start_date
  // Generate token, create profile, send email
  // Return link and success message
}
```

**Components to Create:**

1. **src/app/induction/components/HRDashboardTriggers.tsx** — Server component
   - Fetches `listEmployeesJoiningInNext7Days()`
   - Displays in color-coded list (🔴 Today, 🟡 3-5 days, 🟢 6-7 days)
   - Filter bar: by department, by status (pending/setup)
   - Alert count badge at top
   - Renders rows with `HRDashboardRow`

2. **src/app/induction/components/HRDashboardRow.tsx** — Client component
   - Per-employee row with:
     - Name, email, department
     - Join date with countdown ("Joins in 3 days")
     - Urgency badge (color-coded)
     - Status badge (Created / Sent / In Progress)
     - Action buttons: Generate Link, View Link, Resend Email
   - Handles click actions via `useTransition`

3. **src/app/induction/components/QuickGenerateModal.tsx** — Client component
   - Modal form for quick link generation
   - Fields:
     - Employee name (auto-filled, read-only)
     - Department (auto-filled, read-only)
     - Start date (auto-filled, read-only)
     - Buddy picker (optional, searchable dropdown)
     - Template picker (Standard / IT-Heavy / Remote)
   - Submit button → calls `quickGenerateLinkFromDashboard`
   - Toast on success: "Link generated and email sent to [email]"
   - Show link for manual sharing if needed

**Page File:**

Create `src/app/induction/hr-dashboard/page.tsx`:

```typescript
import { AppShell } from "@/app/components/AppShell";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { canManageInductions } from "@/app/induction/roles";
import { HRDashboardTriggers } from "@/app/induction/components/HRDashboardTriggers";
import { redirect } from "next/navigation";

export default async function HRDashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) redirect("/login");
  
  const actor = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { role: { select: { role_type: true } } }
  });
  
  if (!canManageInductions(actor?.role?.role_type ?? null)) {
    return <div className="p-6">Access denied.</div>;
  }
  
  return (
    <AppShell email={session.user.email} role={actor?.role?.role_type} name={session.user.name}>
      <HRDashboardTriggers />
    </AppShell>
  );
}
```

**UI/UX:**
- Header: "7-Day Onboarding Alerts"
- Filter bar with department dropdown + status toggle
- Badge showing total count: "5 employees need setup"
- Table/list of employees with urgency colors
- Actions inline or in row dropdown menu

---

### SLICE C: Onboarding Dashboard (Workflow Stages)

**Purpose:** Visual workflow showing all employees by stage (Pre-Join → Completed) with metrics.

**Routes:**
- `GET /induction/dashboard` — Server component, visible to all (but limited data per role)

**Database:**
- No schema changes. Calculates stage based on `induction_profile.start_date` vs today + step completion %.

**Queries to Add:**

```typescript
export interface StageMetrics {
  stageName: "Pre-Join" | "Day 1" | "Week 1" | "Month 1" | "Completed";
  employeeCount: number;
  completionPercentage: number; // % of employees in this stage who completed all steps
}

export interface StageEmployee {
  userId: number;
  fullName: string;
  email: string;
  departmentName: string;
  startDate: string;
  stepsCompleted: number;
  totalSteps: number;
  progressPercentage: number;
  inductionStatus: string;
}

export async function getOnboardingStageMetrics(): Promise<StageMetrics[]> {
  // Return metrics for all 5 stages:
  // - Pre-Join: start_date > today
  // - Day 1: start_date <= today AND start_date + 1 day > today
  // - Week 1: start_date + 1 day <= today AND start_date + 7 days > today
  // - Month 1: start_date + 7 days <= today AND start_date + 30 days > today
  // - Completed: all steps done OR status = "Completed"
  // Return count and % completion for each stage
}

export async function getEmployeesInStage(stageName: string): Promise<StageEmployee[]> {
  // Filter by stage logic above
  // Return list of employees with their progress details
}

export async function getOnboardingDashboardStats(): Promise<{
  totalNewHiresThisMonth: number;
  branchesCovered: string[];
  pendingChecklists: number;
  averageCompletionRate: number;
}> {
  // Summary stats for cards at top of dashboard
}
```

**Components to Create:**

1. **src/app/induction/components/OnboardingDashboard.tsx** — Server component
   - Fetches all metrics and stats
   - Renders summary stat cards
   - Renders Kanban board with 5 columns
   - Maps stage data to `StageColumn` components

2. **src/app/induction/components/SummaryStatsCards.tsx** — Server component
   - 4 cards showing:
     - Total New Hires This Month
     - Branches Covered
     - Pending Checklists
     - Average Completion Rate %
   - Simple cards with large numbers + trend indicators

3. **src/app/induction/components/StageColumn.tsx** — Client component
   - Per-stage Kanban column showing:
     - Stage name header
     - Count badge (e.g. "5 employees")
     - Progress bar (% completion)
     - Click to expand (for HR/OD only)
   - Expandable section: shows list of employees in stage

4. **src/app/induction/components/StageEmployeeList.tsx** — Client component
   - Modal/popover with employees in selected stage
   - Per employee card:
     - Name, email, department
     - Start date
     - Progress % with visual bar
     - Action button (View Profile, Edit Link, Regenerate Link)
   - Only visible to HR/OD; staff see "No access"

**Page File:**

Create `src/app/induction/dashboard/page.tsx`:

```typescript
import { AppShell } from "@/app/components/AppShell";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { OnboardingDashboard } from "@/app/induction/components/OnboardingDashboard";
import { redirect } from "next/navigation";

export default async function OnboardingDashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) redirect("/login");
  
  return (
    <AppShell email={session.user.email} name={session.user.name} role={session.user.role}>
      <OnboardingDashboard />
    </AppShell>
  );
}
```

**UI/UX:**
- Top: 4 summary stat cards
- Below: Kanban board with 5 columns (Pre-Join | Day 1 | Week 1 | Month 1 | Completed)
- Each column shows count + progress bar
- Clickable by HR/OD: expands to show employee list
- Public view: see stages + counts only, cannot click for names

---

### SLICE D: Workflow Cards & Modals

**Purpose:** Enhance existing Onboarding/Offboarding cards with full workflow diagram modal.

**Routes:**
- No new routes. Enhancement to existing card on HRMS Dashboard.

**Database:**
- No schema changes for MVP. Keep workflows hardcoded in `templates.ts`.

**Components to Create:**

1. **src/app/induction/components/WorkflowCard.tsx** — Client component
   - Display on HRMS Dashboard (replaces or enhances existing card)
   - Shows:
     - Title: "Onboarding Workflow" or "Offboarding Workflow"
     - Workflow preview image/icon (optional, can be simple text)
     - Version badge: "v2.1 — Updated Apr 2026"
     - "View Workflow" button
   - On click: opens `WorkflowModal`

2. **src/app/induction/components/WorkflowModal.tsx** — Client component
   - Modal showing full workflow
   - Header: "[Type] Workflow - v2.1"
   - Body: `WorkflowDiagram` component
   - Footer:
     - For HR/OD: "Open Training Portal" button (external link from env)
     - For all: "Close" button
   - Role-based visibility controlled here

3. **src/app/induction/components/WorkflowDiagram.tsx** — Client component
   - Renders workflow steps as timeline or flowchart
   - Shows per step:
     - Step number (1, 2, 3, etc.)
     - Title
     - Description
     - Day offset ("Day 0", "Day 1", "Day 5", etc.)
   - Visual: can be vertical cards or horizontal timeline
   - Data from hardcoded WORKFLOW_STEPS in `templates.ts`

**Update HrmsDashboard.tsx:**
- Find the existing Onboarding/Offboarding cards
- Replace or wrap with new `WorkflowCard` component
- Pass workflow type as prop ("Onboarding" or "Offboarding")

**UI/UX:**
- Card thumbnail with version label
- Click → modal with full timeline/flowchart
- HR/OD sees "Open Training Portal" button
- Employees see read-only workflow

---

### SLICE E: Feedback Loop & Analytics

**Purpose:** Surveys, health score gauge, problem detection, recommendations, impact tracking.

**Prisma Schema Changes:**

Add to `schema.prisma`:

```prisma
model survey_template {
  id Int @id @default(autoincrement())
  milestone String // "Day1", "Week2", "Month1", "Month3"
  questions Json // array: [{ id, text, type, options }]
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
  
  @@unique([milestone])
}

model survey_response {
  id Int @id @default(autoincrement())
  induction_profile_id Int
  induction_profile induction_profile @relation("responses", fields: [induction_profile_id], references: [id], onDelete: Cascade)
  
  survey_template_id Int
  survey_template survey_template @relation(fields: [survey_template_id], references: [id])
  
  responses Json // { questionId: "5", questionId2: "satisfied", etc. }
  sentiment_score Int? // 1-5 average
  
  submitted_at DateTime
  created_at DateTime @default(now())
  
  @@index([induction_profile_id])
}

model analytics_metric {
  id Int @id @default(autoincrement())
  metric_name String // "confidence", "clarity", "manager_support", "satisfaction"
  value Float // 0-100
  cohort Json? // { department, role }
  
  timestamp DateTime @default(now())
  trend String? // "up", "down", "stable"
  
  @@index([metric_name, timestamp])
}

model recommendation {
  id Int @id @default(autoincrement())
  title String
  evidence String
  action_items Json // ["action 1", "action 2"]
  
  assigned_to Int?
  assigned_user users? @relation(fields: [assigned_to], references: [user_id])
  
  status String @default("New") // "New", "In Progress", "Implemented", "Verified"
  priority String // "High", "Medium", "Low"
  
  due_date DateTime?
  completed_at DateTime?
  
  impact_metric_id Int?
  impact_before Float?
  impact_after Float?
  
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
  
  impact_logs impact_log[]
  
  @@index([status])
}

model impact_log {
  id Int @id @default(autoincrement())
  recommendation_id Int
  recommendation recommendation @relation(fields: [recommendation_id], references: [id], onDelete: Cascade)
  
  metric_name String
  value_before Float
  value_after Float
  improvement_percentage Float
  
  measured_at DateTime
  created_at DateTime @default(now())
  
  @@index([recommendation_id])
}
```

Also update the `induction_profile` relation:

```prisma
model induction_profile {
  // ... existing fields ...
  
  survey_responses survey_response[] @relation("responses")
}

model users {
  // ... existing fields ...
  
  assigned_recommendations recommendation[]
}
```

**Routes:**
- `GET /induction/analytics` — Server component, HR/superadmin only

**Queries to Add:**

```typescript
export async function getInductionHealthScore(): Promise<number> {
  // Average of all recent metrics weighted by recency
  // Return 0-100 score
}

export async function getConfidenceTrajectory(): Promise<Array<{
  milestone: string;
  averageScore: number;
}>> {
  // For each survey milestone (Day1, Week2, Month1, Month3)
  // Calculate average confidence score from responses
  // Return in order
}

export async function getProblemAreas(): Promise<Array<{
  metricName: string;
  currentScore: number;
  percentageRespondingLow: number;
  evidence: string;
}>> {
  // Find metrics scoring < 60%
  // Return with supporting evidence from survey comments
}

export async function getCohortComparison(
  groupBy: "department" | "role"
): Promise<Array<{
  cohort: string;
  confidence: number;
  clarity: number;
  managerSupport: number;
  satisfaction: number;
}>> {
  // Break down metrics by department or role
  // Return comparison table data
}

export async function getRecommendations(): Promise<Array<{
  id: number;
  title: string;
  evidence: string;
  actionItems: string[];
  status: string;
  priority: string;
  assignedTo?: string;
  dueDate?: string;
  impactBefore?: number;
  impactAfter?: number;
}>> {
  // Fetch all recommendations with related data
}

export async function getImpactLog(): Promise<Array<{
  recommendationTitle: string;
  metricName: string;
  beforeValue: number;
  afterValue: number;
  improvementPercentage: number;
  measuredAt: string;
}>> {
  // Timeline of recommendation impacts
}
```

**Server Actions to Add:**

```typescript
export async function submitSurveyResponse(
  inductionProfileId: number,
  milestone: string,
  responses: Record<string, string | number>
): Promise<{ success: boolean; message: string }> {
  // Validate milestone and responses
  // Create survey_response record
  // Calculate sentiment_score (average of numeric responses 1-5)
  // Auto-generate recommendations if metrics low
  // Return success
}

export async function generateRecommendations(): Promise<Recommendation[]> {
  // Analyze all surveys for metrics < 60%
  // Auto-create recommendations with title, evidence, actions
  // Set priority and due_date
  // Return created recommendations
}

export async function updateRecommendationStatus(
  recommendationId: number,
  newStatus: "New" | "In Progress" | "Implemented" | "Verified"
): Promise<void> {
  // Update status
  // If moving to "Implemented", set timestamp
  // If moving to "Verified", update impact fields
}

export async function recordImpactMeasurement(
  recommendationId: number,
  metricName: string,
  afterValue: number
): Promise<void> {
  // Get recommendation's impact_before value
  // Create impact_log record with before → after
  // Calculate improvement %
  // Update recommendation.impact_after
}
```

**Components to Create:**

1. **src/app/induction/components/AnalyticsDashboard.tsx** — Server component
   - Fetches all data
   - Renders sub-components in dashboard layout

2. **src/app/induction/components/HealthScoreGauge.tsx** — Client component
   - Large circular gauge: 0-100 range
   - Color zones: red < 60, yellow 60-80, green > 80
   - Shows current score + trend (↑ +3% vs last month)

3. **src/app/induction/components/ConfidenceTrajectoryChart.tsx** — Client component
   - Line chart using Recharts
   - X-axis: milestones (Day 1, Week 2, Month 1, Month 3)
   - Y-axis: 1-5 confidence scale
   - Shows trend line and data points

4. **src/app/induction/components/ProblemAreasSection.tsx** — Client component
   - List of metrics scoring < 60%
   - Shows: metric name, current score, % reporting issue, quote
   - Button per item: "Create Recommendation"
   - Click → opens recommendation form

5. **src/app/induction/components/RecommendationsBoard.tsx** — Client component
   - Kanban board: New | In Progress | Implemented | Verified
   - Drag-and-drop between columns (or click to change status)
   - Per card:
     - Title
     - Evidence quote
     - Action items list
     - Assigned to (person tag)
     - Due date
     - Priority badge
   - Click card to edit/view details

6. **src/app/induction/components/CohortComparisonTable.tsx** — Client component
   - Table with columns: Cohort | Confidence | Clarity | Manager Support | Satisfaction
   - Rows: departments or roles (user selectable)
   - Color-code cells: green (high) → red (low)
   - Click row to drill down

7. **src/app/induction/components/ImpactLogSection.tsx** — Client component
   - Timeline of recommendations + measured improvements
   - Per entry:
     - Recommendation title
     - Metric name
     - Before → After values
     - % improvement (colored)
     - Date measured
   - Vertical timeline layout

**Page File:**

Create `src/app/induction/analytics/page.tsx`:

```typescript
import { AppShell } from "@/app/components/AppShell";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { AnalyticsDashboard } from "@/app/induction/components/AnalyticsDashboard";
import { canManageInductions } from "@/app/induction/roles";
import { redirect } from "next/navigation";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) redirect("/login");
  
  const actor = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { role: { select: { role_type: true } } }
  });
  
  if (!canManageInductions(actor?.role?.role_type ?? null)) {
    return <div className="p-6">Access denied.</div>;
  }
  
  return (
    <AppShell email={session.user.email} role={actor?.role?.role_type} name={session.user.name}>
      <AnalyticsDashboard />
    </AppShell>
  );
}
```

**Survey Templates:**

Add to code (in `src/app/induction/templates.ts` or new file):

```typescript
export const SURVEY_TEMPLATES = {
  Day1: {
    milestone: "Day1",
    questions: [
      {
        id: "day1_overall",
        text: "How's your first day?",
        type: "emoji", // emoji scale
        options: ["😞", "😐", "😊"]
      },
      {
        id: "day1_word",
        text: "One word to describe today:",
        type: "text"
      }
    ]
  },
  Week2: {
    milestone: "Week2",
    questions: [
      {
        id: "week2_confidence",
        text: "Confidence in your role",
        type: "scale",
        options: [1, 2, 3, 4, 5]
      },
      {
        id: "week2_clarity",
        text: "Clarity of expectations",
        type: "scale",
        options: [1, 2, 3, 4, 5]
      },
      {
        id: "week2_training",
        text: "Quality of training",
        type: "scale",
        options: [1, 2, 3, 4, 5]
      },
      {
        id: "week2_manager",
        text: "Manager support",
        type: "scale",
        options: [1, 2, 3, 4, 5]
      },
      {
        id: "week2_helpful",
        text: "Which 3 steps were most helpful? (comma separated)",
        type: "text"
      },
      {
        id: "week2_missing",
        text: "What's missing?",
        type: "text"
      },
      {
        id: "week2_recommend",
        text: "Would you recommend to a friend?",
        type: "multiple_choice",
        options: ["Yes", "No"]
      }
    ]
  },
  Month1: {
    milestone: "Month1",
    questions: [
      {
        id: "month1_ready",
        text: "Ready to go solo?",
        type: "scale",
        options: [1, 2, 3, 4, 5]
      },
      {
        id: "month1_satisfaction",
        text: "Overall satisfaction",
        type: "scale",
        options: [1, 2, 3, 4, 5]
      },
      {
        id: "month1_best",
        text: "Best part so far?",
        type: "text"
      },
      {
        id: "month1_improve",
        text: "What could improve?",
        type: "text"
      }
    ]
  },
  Month3: {
    milestone: "Month3",
    questions: [
      // Full retrospective (10 questions)
      {
        id: "m3_overall",
        text: "Overall induction experience (1-5)",
        type: "scale",
        options: [1, 2, 3, 4, 5]
      },
      {
        id: "m3_stay",
        text: "Likelihood to stay (1-10)",
        type: "scale",
        options: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      },
      {
        id: "m3_helpful",
        text: "What helped most?",
        type: "text"
      },
      {
        id: "m3_prevent",
        text: "What would prevent this for next hire?",
        type: "text"
      }
      // ... add more as needed
    ]
  }
};
```

**Analytics Calculations:**

```typescript
// Health Score = average of normalized metrics
function calculateHealthScore(metrics: Record<string, number>): number {
  const keys = Object.keys(metrics);
  const sum = keys.reduce((acc, key) => acc + (metrics[key] || 0), 0);
  return Math.round((sum / keys.length) * 20); // scale to 0-100
}

// Problem detection
function getProblemAreas(metrics: Record<string, number>): string[] {
  return Object.entries(metrics)
    .filter(([, value]) => value < 60)
    .map(([key]) => key);
}

// Auto-recommend based on problems
function generateRecommendationFromProblem(metricName: string, score: number): Recommendation {
  const recommendations: Record<string, Recommendation> = {
    clarity: {
      title: "Redesign training materials",
      evidence: `${100 - score}% of new hires found training unclear`,
      actionItems: ["Audit training docs", "Add video walkthroughs", "Create glossary"]
    },
    // ... more mappings
  };
  return recommendations[metricName] || null;
}
```

**UI/UX:**
- Top: Large health score gauge (center, prominent)
- Trend indicator below score
- 2-column grid below:
  - Left: Confidence trajectory line chart
  - Right: Problem areas list
- Full-width: Recommendations Kanban board
- Bottom: Cohort comparison table
- Footer: Impact log timeline

---

### BONUS 1: Day 0 Kit Auto-Email

**Implementation:**

Add to `src/app/induction/actions.ts` (inside `createInduction`):

```typescript
// After profile is created:
await sendDayZeroKitEmail({
  employeeEmail: user.email,
  employeeName: user.user_profile?.full_name || "New Team Member",
  inductionLink: `${process.env.NEXTAUTH_URL}/induction/${token}`,
  buddyName: buddy?.user_profile?.full_name,
  buddyEmail: buddy?.email,
  departmentName: employment?.department,
  startDate: startDate.toLocaleDateString()
});
```

**Email Function:**

Create `src/lib/induction-email.ts`:

```typescript
export async function sendDayZeroKitEmail(params: {
  employeeEmail: string;
  employeeName: string;
  inductionLink: string;
  buddyName?: string;
  buddyEmail?: string;
  departmentName?: string;
  startDate: string;
}): Promise<void> {
  const emailContent = `
    Subject: Welcome to [Company]! Your Onboarding Starts ${params.startDate}
    
    Hi ${params.employeeName},
    
    We're excited to have you join ${params.departmentName} on ${params.startDate}!
    
    Your Personal Onboarding Checklist:
    ${params.inductionLink}
    
    ${params.buddyName ? `Your Buddy: ${params.buddyName} (${params.buddyEmail})` : ""}
    
    This Week You'll:
    • IT Equipment Setup
    • Compliance Training
    • Team Introduction
    
    Questions? Reply to this email or contact HR.
    
    Welcome aboard!
    HR Team
  `;
  
  // MVP: Log to console
  console.info("[induction] Day 0 Kit email:", {
    to: params.employeeEmail,
    subject: `Welcome to [Company]! Your Onboarding Starts ${params.startDate}`,
    body: emailContent
  });
  
  // Later: Integrate with Resend, SendGrid, etc.
  // await emailProvider.send(emailContent);
}
```

---

### BONUS 2: Induction Health Score on Management Dashboard

**Update Dashboard:**

Add to `src/app/components/HrmsDashboard.tsx` or create card in management dashboard:

```typescript
export async function InductionHealthCard() {
  const score = await getInductionHealthScore();
  const previousScore = await getInductionHealthScoreForMonth(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  );
  
  const trend = score > previousScore ? "up" : score < previousScore ? "down" : "stable";
  const trendPercent = Math.abs(score - previousScore);
  
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Induction Health</h3>
      <div className="text-4xl font-bold text-blue-600 mb-2">{score}%</div>
      <div className={`text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
        {trend === 'up' ? '↑' : '↓'} {trendPercent}% vs last month
      </div>
      <a href="/induction/analytics" className="text-blue-500 text-sm mt-4 block">
        View Details →
      </a>
    </div>
  );
}
```

**Query to Add:**

```typescript
export async function getInductionHealthScoreForMonth(month: Date): Promise<number> {
  // Get all survey responses submitted in given month
  // Calculate health score from those responses
  // Return as 0-100
}
```

---

### BONUS 3: Buddy Notifications

**Implementation:**

Add to `src/app/induction/actions.ts` (inside `createInduction` or in separate function):

```typescript
async function notifyBuddy(params: {
  buddyUserId: number;
  newHireName: string;
  startDate: Date;
  departmentName: string;
}): Promise<void> {
  // MVP: Log to console
  console.info("[induction] Buddy notification:", {
    buddy_id: params.buddyUserId,
    new_hire: params.newHireName,
    start_date: params.startDate.toLocaleDateString(),
    department: params.departmentName,
    message: `You've been assigned as buddy for ${params.newHireName} joining on ${params.startDate.toLocaleDateString()}`
  });
  
  // Later: Send real notification (email, in-app, Slack, etc.)
}
```

Call in `createInduction`:

```typescript
if (buddyUserId) {
  await notifyBuddy({
    buddyUserId,
    newHireName: user.user_profile?.full_name || "New Team Member",
    startDate,
    departmentName: employment?.department || "Company"
  });
}
```

---

## COMPLETE FILE STRUCTURE

After building all slices + bonuses:

```
src/
├── app/
│   ├── induction/
│   │   ├── components/
│   │   │   ├── HRDashboardTriggers.tsx (Slice B)
│   │   │   ├── HRDashboardRow.tsx (Slice B)
│   │   │   ├── QuickGenerateModal.tsx (Slice B)
│   │   │   ├── OnboardingDashboard.tsx (Slice C)
│   │   │   ├── SummaryStatsCards.tsx (Slice C)
│   │   │   ├── StageColumn.tsx (Slice C)
│   │   │   ├── StageEmployeeList.tsx (Slice C)
│   │   │   ├── WorkflowCard.tsx (Slice D)
│   │   │   ├── WorkflowModal.tsx (Slice D)
│   │   │   ├── WorkflowDiagram.tsx (Slice D)
│   │   │   ├── AnalyticsDashboard.tsx (Slice E)
│   │   │   ├── HealthScoreGauge.tsx (Slice E)
│   │   │   ├── ConfidenceTrajectoryChart.tsx (Slice E)
│   │   │   ├── ProblemAreasSection.tsx (Slice E)
│   │   │   ├── RecommendationsBoard.tsx (Slice E)
│   │   │   ├── CohortComparisonTable.tsx (Slice E)
│   │   │   └── ImpactLogSection.tsx (Slice E)
│   │   ├── hr-dashboard/
│   │   │   └── page.tsx (Slice B)
│   │   ├── dashboard/
│   │   │   └── page.tsx (Slice C)
│   │   ├── analytics/
│   │   │   └── page.tsx (Slice E)
│   │   ├── control-centre/
│   │   │   └── page.tsx (Slice A - existing)
│   │   ├── [token]/
│   │   │   └── page.tsx (Slice A - existing)
│   │   ├── actions.ts (add Slice B, E actions)
│   │   ├── queries.ts (add Slice B, C, E queries)
│   │   ├── roles.ts (existing)
│   │   ├── templates.ts (add survey templates)
│   │   ├── utils.ts (existing)
│   │   └── page.tsx (redirect - existing)
│   ├── api/
│   │   └── induction/
│   │       └── seed/
│   │           └── route.ts (existing - dev-only)
├── lib/
│   └── induction-email.ts (Bonus 1 - email function)
└── prisma/
    ├── schema.prisma (add Slice E tables)
    └── seed.ts (existing)
```

---

## BUILD CHECKLIST

**Database:**
- [ ] Add 5 new tables to `schema.prisma` (Slice E)
- [ ] Run `npx prisma generate`
- [ ] Run `npx prisma db push`
- [ ] Verify no errors

**Slice B (HR Dashboard 7-Day Triggers):**
- [ ] Add `listEmployeesJoiningInNext7Days()` query
- [ ] Add `quickGenerateLinkFromDashboard()` action
- [ ] Create `HRDashboardTriggers.tsx` server component
- [ ] Create `HRDashboardRow.tsx` client component
- [ ] Create `QuickGenerateModal.tsx` client component
- [ ] Create `src/app/induction/hr-dashboard/page.tsx`
- [ ] Test: Navigate to `/induction/hr-dashboard`, see upcoming hires, generate link

**Slice C (Onboarding Dashboard):**
- [ ] Add `getOnboardingStageMetrics()` query
- [ ] Add `getEmployeesInStage()` query
- [ ] Add `getOnboardingDashboardStats()` query
- [ ] Create `OnboardingDashboard.tsx` server component
- [ ] Create `SummaryStatsCards.tsx` server component
- [ ] Create `StageColumn.tsx` client component
- [ ] Create `StageEmployeeList.tsx` client component
- [ ] Create `src/app/induction/dashboard/page.tsx`
- [ ] Test: Navigate to `/induction/dashboard`, see 5-stage Kanban board

**Slice D (Workflow Cards Modal):**
- [ ] Create `WorkflowCard.tsx` client component
- [ ] Create `WorkflowModal.tsx` client component
- [ ] Create `WorkflowDiagram.tsx` client component
- [ ] Update `HrmsDashboard.tsx` to use `WorkflowCard`
- [ ] Test: Click card on dashboard, see workflow modal

**Slice E (Analytics & Feedback):**
- [ ] Add survey templates to `templates.ts`
- [ ] Add 5 Slice E queries
- [ ] Add 4 Slice E server actions
- [ ] Create 7 Slice E components
- [ ] Create `src/app/induction/analytics/page.tsx`
- [ ] Test: Navigate to `/induction/analytics`, see health gauge + charts

**Bonuses:**
- [ ] Create `src/lib/induction-email.ts` and wire into `createInduction()`
- [ ] Add `getInductionHealthScoreForMonth()` query
- [ ] Add `InductionHealthCard` to management dashboard
- [ ] Wire `notifyBuddy()` into `createInduction()`

**Quality Assurance:**
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run lint` → 0 new errors
- [ ] All new routes accessible and gated correctly
- [ ] All components render without crashes
- [ ] Test end-to-end: Create profile → see in dashboards → surveys work

---

## DELIVERY FORMAT

When complete, deliver:

1. **Updated `prisma/schema.prisma`** — with all 5 new tables
2. **Updated `src/app/induction/queries.ts`** — with all new queries
3. **Updated `src/app/induction/actions.ts`** — with all new actions
4. **Updated `src/app/induction/templates.ts`** — with survey templates + bonus updates
5. **All new component files** — organized by slice
6. **All new page files** — `/hr-dashboard`, `/dashboard`, `/analytics`
7. **Updated existing files** — `HrmsDashboard.tsx`, `createInduction()` with email/notifications
8. **New lib file** — `src/lib/induction-email.ts`
9. **Migration confirmation** — output of `npx prisma db push`
10. **Build verification** — output of `npx tsc --noEmit` and `npm run lint`

---

## NOTES

- **Authentication:** All HR Dashboard, Onboarding Dashboard, Analytics routes gated to `superadmin` / `hr` via `canManageInductions()`
- **Public Access:** Personal induction links (`/induction/[token]`) require valid token only
- **Email:** MVP uses `console.log`; swap to real provider (Resend, SendGrid) in production
- **Charts:** Use Recharts (already available in project)
- **Styling:** Tailwind only (no shadcn UI components)
- **Type Safety:** Full TypeScript, no `any` types
- **Error Handling:** Try-catch blocks, user-facing error messages in toast/alert

---

**Status: READY TO BUILD**

Copy this entire prompt and paste into Claude in your VSCode with access to your codebase.

Claude will:
1. Create/update all files
2. Run typecheck and lint
3. Confirm build success
4. Provide migration command
5. Give you testing instructions

**Then you:**
1. Run `npx prisma db push`
2. Test each slice
3. Deploy when confident

---

Good luck! 🚀
