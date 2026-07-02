import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AppShell from "@/app/components/AppShell";
import { WorkflowCenterView } from "./WorkflowCenterView";
import {
  loadWorkflowActor,
  canAccessWorkflowCenter,
  canCreateWorkflow,
  canSeeAllDepartments,
} from "@/lib/workflow/permissions";
import {
  listVisibleDepartments,
  listWorkflowsForActor,
  listKnownCategories,
} from "@/lib/workflow/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Workflow Center",
};

/**
 * Workflow Center — DB-backed list page.
 *
 * Server-side scoping (enforced via permissions.ts + queries.ts):
 *   - Superadmin / admin / od → all departments, can view all
 *   - HR → all departments but only active workflows, read-only
 *   - HOD → own department only, full CRUD
 *   - Everyone else → redirected
 */
export default async function WorkflowCenterPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const actor = await loadWorkflowActor(session.user.email);
  if (!actor || !canAccessWorkflowCenter(actor)) {
    redirect("/home");
  }

  const [workflows, departments, knownCategories] = await Promise.all([
    listWorkflowsForActor(actor),
    listVisibleDepartments(actor),
    listKnownCategories(actor),
  ]);

  return (
    <AppShell
      email={session.user.email}
      role={actor.roleType}
      name={session.user.name ?? null}
    >
      <WorkflowCenterView
        workflows={workflows}
        departments={departments}
        canCreateNew={canCreateWorkflow(actor)}
        canEditAny={actor.roleType === "superadmin" || actor.roleType === "hod"}
        showAllTabs={canSeeAllDepartments(actor)}
        lockedDepartmentId={
          actor.roleType === "hod" ? actor.departmentId : null
        }
        knownCategories={knownCategories}
      />
    </AppShell>
  );
}
