import Link from "next/link";
import OnboardingDashboard from "@/app/induction/components/OnboardingDashboard";
import type {
  CombinedHireRow,
  CombinedExitRow,
  DepartmentOption,
} from "@/app/induction/queries";

export const dynamic = "force-static";

export const metadata = {
  title: "HR Onboarding Dashboard Preview",
};

/**
 * Public no-auth preview of the HR-facing onboarding dashboard
 * (real route /induction/onboarding-dashboard?type=onboarding is role-gated
 * to superadmin/hr/od).
 *
 * Renders OnboardingDashboard with mocked CombinedHireRow + DepartmentOption
 * data so reviewers can see the layout (2-card grid, workflow preview, template
 * switcher) without needing HR credentials. Action buttons in this view will
 * fail because they call real server actions with fake user IDs — that's
 * expected. Read-only preview.
 */
export default function HROnboardingDashboardPreview() {
  const today = new Date();
  const iso = (offsetDays: number) =>
    new Date(today.getTime() + offsetDays * 86400000).toISOString().slice(0, 10);

  const mockHires: CombinedHireRow[] = [
    {
      source: "local",
      key: "mock-1",
      userId: 1001,
      email: "alia.tan.demo@ebright.my",
      fullName: "Alia Tan (mock)",
      position: "FT EXEC",
      departmentName: "Academy",
      startDate: iso(0),
      daysUntilStart: 0,
      isWithin7Days: true,
      hasPendingRequest: false,
      inductionProfileStatus: "In Progress",
    },
    {
      source: "local",
      key: "mock-2",
      userId: 1002,
      email: "kavin.demo@ebright.my",
      fullName: "Kavin Naidu (mock)",
      position: "PT COACH",
      departmentName: "Operation",
      startDate: iso(3),
      daysUntilStart: 3,
      isWithin7Days: true,
      hasPendingRequest: true,
      inductionProfileStatus: null,
    },
    {
      source: "ebrightleads",
      key: "mock-3",
      userId: null,
      email: "siti.demo@example.com",
      fullName: "Siti Aminah (mock — from EbrightLeads)",
      position: "INTERN",
      departmentName: "Marketing",
      startDate: iso(7),
      daysUntilStart: 7,
      isWithin7Days: true,
      hasPendingRequest: false,
      inductionProfileStatus: null,
    },
    {
      source: "local",
      key: "mock-4",
      userId: 1004,
      email: "wei.demo@ebright.my",
      fullName: "Wei Han (mock)",
      position: "FT COACH",
      departmentName: "Academy",
      startDate: iso(12),
      daysUntilStart: 12,
      isWithin7Days: false,
      hasPendingRequest: false,
      inductionProfileStatus: "Sent",
    },
    {
      source: "local",
      key: "mock-5",
      userId: 1005,
      email: "rina.demo@ebright.my",
      fullName: "Rina Yusof (mock)",
      position: "FT EXEC",
      departmentName: "Finance",
      startDate: iso(20),
      daysUntilStart: 20,
      isWithin7Days: false,
      hasPendingRequest: false,
      inductionProfileStatus: null,
    },
  ];

  const mockExits: CombinedExitRow[] = [
    {
      source: "local",
      key: "mock-exit-1",
      userId: 2001,
      email: "leaving.demo@ebright.my",
      fullName: "Tan Leaving (mock)",
      position: "FT EXEC",
      departmentName: "Operation",
      endDate: iso(5),
      daysUntilEnd: 5,
      isWithin7Days: true,
      hasPendingRequest: false,
      inductionProfileStatus: null,
    },
  ];

  const mockDepartments: DepartmentOption[] = [
    { id: 1, name: "CEO Office" },
    { id: 2, name: "Operation" },
    { id: 3, name: "Academy" },
    { id: 4, name: "Human Resources" },
    { id: 5, name: "Finance" },
    { id: 7, name: "Marketing" },
    { id: 8, name: "Optimisation" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <PreviewBanner />
      <OnboardingDashboard
        hires={mockHires}
        exits={mockExits}
        view="onboarding"
        ownInduction={null}
        isManager={true}
        substepTemplates={[]}
        departments={mockDepartments}
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
            <code className="text-xs bg-amber-100 px-1 rounded">
              /induction/onboarding-dashboard?type=onboarding
            </code>{" "}
            (HR/admin/od only). Action buttons will fail (fake user IDs).
          </span>
        </div>
        <div className="flex gap-4">
          <Link
            href="/preview/candidate-onboarding"
            className="text-xs font-semibold text-amber-900 underline hover:text-amber-700"
          >
            → Candidate preview
          </Link>
          <Link
            href="/preview/hrms-sidebar"
            className="text-xs font-semibold text-amber-900 underline hover:text-amber-700"
          >
            → Sidebar preview
          </Link>
        </div>
      </div>
    </div>
  );
}
