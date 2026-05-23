import Link from "next/link";
import PersonalInductionView from "@/app/induction/components/PersonalInductionView";
import type { InductionView } from "@/app/induction/queries";

export const dynamic = "force-static";

export const metadata = {
  title: "Candidate Onboarding Preview",
};

/**
 * Public no-auth preview of the candidate-facing onboarding page
 * (the real route is /induction/[token], protected by token + session).
 *
 * Renders PersonalInductionView with fully-mocked InductionView data so
 * reviewers can see exactly what a new hire sees, without needing a real
 * token from the database. canMarkComplete=false → read-only mode
 * (interactions disabled, shows "sign in" hint banner).
 */
export default function CandidateOnboardingPreview() {
  const mockProfile: InductionView = {
    id: 9999,
    userId: 9999,
    employeeName: "Alia Tan (mock)",
    employeeEmail: "alia.tan.demo@ebright.my",
    departmentId: 3,
    departmentName: "Academy",
    inductionType: "Onboarding",
    workflowTemplate: "Standard",
    startDate: new Date().toISOString(),
    exitDate: null,
    targetDurationDays: 7,
    linkToken: "preview-token-not-real",
    linkExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: "In Progress",
    buddyName: "Mr. Razif (mock)",
    buddyEmail: "razif.demo@ebright.my",
    steps: [
      {
        id: 1,
        stepNumber: 1,
        title: "IT Equipment Setup",
        description: "Receive laptop, phone, and other equipment",
        responsibleName: "IT Team",
        responsibleEmail: "it@ebright.my",
        dueDate: new Date().toISOString().slice(0, 10),
        status: "Completed",
        completedAt: new Date().toISOString(),
        evidenceFileId: null,
        evidenceUploadedAt: null,
      },
      {
        id: 2,
        stepNumber: 2,
        title: "Compliance Training",
        description: "Complete mandatory compliance modules",
        responsibleName: "HR",
        responsibleEmail: "hr@ebright.my",
        dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        status: "Completed",
        completedAt: new Date().toISOString(),
        evidenceFileId: null,
        evidenceUploadedAt: null,
      },
      {
        id: 3,
        stepNumber: 3,
        title: "Team Introduction",
        description: "Meet your team members",
        responsibleName: "Mr. Razif",
        responsibleEmail: "razif.demo@ebright.my",
        dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        status: "In Progress",
        completedAt: null,
        evidenceFileId: null,
        evidenceUploadedAt: null,
      },
      {
        id: 4,
        stepNumber: 4,
        title: "Buddy Meeting",
        description: "Connect with your induction buddy",
        responsibleName: "Mr. Razif",
        responsibleEmail: "razif.demo@ebright.my",
        dueDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
        status: "Pending",
        completedAt: null,
        evidenceFileId: null,
        evidenceUploadedAt: null,
      },
      {
        id: 5,
        stepNumber: 5,
        title: "Project Overview",
        description: "Learn about current projects",
        responsibleName: "Department Head",
        responsibleEmail: "academy.hod@ebright.my",
        dueDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
        status: "Pending",
        completedAt: null,
        evidenceFileId: null,
        evidenceUploadedAt: null,
      },
      {
        id: 6,
        stepNumber: 6,
        title: "Tools & Access Setup",
        description: "Set up work tools and system access",
        responsibleName: "IT Team",
        responsibleEmail: "it@ebright.my",
        dueDate: new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10),
        status: "Pending",
        completedAt: null,
        evidenceFileId: null,
        evidenceUploadedAt: null,
      },
      {
        id: 7,
        stepNumber: 7,
        title: "Documentation Review",
        description: "Review company documentation and policies",
        responsibleName: "Mr. Razif",
        responsibleEmail: "razif.demo@ebright.my",
        dueDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
        status: "Pending",
        completedAt: null,
        evidenceFileId: null,
        evidenceUploadedAt: null,
      },
      {
        id: 8,
        stepNumber: 8,
        title: "Welcome Call",
        description: "Final check-in with HR",
        responsibleName: "HR",
        responsibleEmail: "hr@ebright.my",
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        status: "Pending",
        completedAt: null,
        evidenceFileId: null,
        evidenceUploadedAt: null,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <PreviewBanner />
      <PersonalInductionView
        profile={mockProfile}
        canMarkComplete={false}
        substepTemplates={[]}
      />
    </div>
  );
}

function PreviewBanner() {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-6 py-3">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-sm">
        <div>
          <span className="font-semibold text-amber-900">⚠ Preview only</span>
          <span className="text-amber-800 ml-2">
            Mock data, no login required. Real route is{" "}
            <code className="text-xs bg-amber-100 px-1 rounded">/induction/[token]</code>{" "}
            (token-protected). Buttons here will NOT submit anything.
          </span>
        </div>
        <Link
          href="/preview/hr-onboarding-dashboard"
          className="text-xs font-semibold text-amber-900 underline hover:text-amber-700"
        >
          → HR dashboard preview
        </Link>
      </div>
    </div>
  );
}
