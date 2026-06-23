import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { queryEbrightHrfs } from "@/lib/ebright-hrfs";
import AppShell from "@/app/components/AppShell";
import WorkingHoursEditorView, {
  type StaffOption,
  type ScheduleVersion,
} from "@/app/components/WorkingHoursEditorView";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

const ALLOWED_ROLE_TYPES = new Set(["superadmin", "ceo", "hr"]);

interface PageProps {
  searchParams: Promise<{ staffId?: string }>;
}

export default async function WorkingHoursPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const me = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { role: { select: { role_type: true } } },
  });
  const roleType = me?.role?.role_type?.toLowerCase() ?? "";
  const allowed = ALLOWED_ROLE_TYPES.has(roleType);

  const userEmail = session.user.email;
  const userName = session.user.name ?? null;
  const userRole = (session.user as { role?: string } | undefined)?.role ?? "USER";

  if (!allowed) {
    return (
      <AppShell email={userEmail} role={userRole} name={userName}>
        <div className="min-h-full bg-slate-50 flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mb-5">
              <ShieldAlert className="w-7 h-7 text-rose-600" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-semibold text-slate-900">Restricted Access</h1>
            <p className="mt-2 text-sm text-slate-600">
              The working-hours editor is available to HR, CEO, and superadmin roles only.
            </p>
            <Link
              href="/attendance"
              className="mt-6 inline-flex items-center h-10 px-4 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
            >
              Back to Attendance
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  // Active staff from HRFS — same source the Summary/Report consume.
  const staffResult = await queryEbrightHrfs<{
    id: number;
    name: string | null;
    branch: string | null;
    employee_id: string | null;
    position: string | null;
    working_hours: unknown;
  }>(
    `SELECT id, name, branch, "employeeId" AS employee_id, position,
            "workingHours" AS working_hours
       FROM public."BranchStaff"
      WHERE status = 'Active'
      ORDER BY branch ASC NULLS LAST, name ASC`,
  );
  const staff: StaffOption[] = staffResult.rows.map((s) => ({
    id: s.id,
    name: s.name ?? `Staff #${s.id}`,
    branch: s.branch,
    employeeId: s.employee_id,
    position: s.position,
    currentSchedule:
      (s.working_hours as Record<string, unknown> | null) ?? null,
  }));

  const sp = await searchParams;
  const requestedId = sp.staffId ? Number(sp.staffId) : NaN;
  const selectedId = Number.isFinite(requestedId)
    ? staff.find((s) => s.id === requestedId)?.id ?? null
    : staff[0]?.id ?? null;

  // Load versions for the selected staff (oldest-first).
  let versions: ScheduleVersion[] = [];
  if (selectedId !== null) {
    const vRes = await queryEbrightHrfs<{ effective_from: string; schedule: unknown }>(
      `SELECT to_char("effectiveFrom", 'YYYY-MM-DD') AS effective_from,
              schedule
         FROM public."BranchStaffSchedule"
        WHERE "branchStaffId" = $1
        ORDER BY "effectiveFrom" ASC`,
      [selectedId],
    );
    versions = vRes.rows.map((r) => ({
      effectiveFrom: r.effective_from,
      schedule: r.schedule as ScheduleVersion["schedule"],
    }));
  }

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <WorkingHoursEditorView
        staff={staff}
        selectedId={selectedId}
        versions={versions}
      />
    </AppShell>
  );
}
