import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/app/components/AppShell";
import { WorkflowDetailView } from "./WorkflowDetailView";
import {
  loadWorkflowActor,
  canAccessWorkflowCenter,
  canEditWorkflowForDepartment,
  canDeleteWorkflow,
} from "@/lib/workflow/permissions";
import { getWorkflowDetailForActor } from "@/lib/workflow/queries";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ workflowId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Workflow detail / builder. Editable when `?edit=1` AND actor has edit
 * rights on this workflow's department.
 */
export default async function WorkflowDetailPage({ params, searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const actor = await loadWorkflowActor(session.user.email);
  if (!actor || !canAccessWorkflowCenter(actor)) {
    redirect("/home");
  }

  const { workflowId } = await params;
  const sp = await searchParams;
  const id = Number(workflowId);
  if (!Number.isFinite(id)) notFound();

  const workflow = await getWorkflowDetailForActor(id, actor);
  if (!workflow) notFound(); // either doesn't exist OR actor isn't allowed

  const wantEdit = sp.edit === "1";
  const canEdit = wantEdit && canEditWorkflowForDepartment(actor, workflow.departmentId);

  return (
    <AppShell
      email={session.user.email}
      role={actor.roleType}
      name={session.user.name ?? null}
    >
      <WorkflowDetailView
        workflow={workflow}
        canEdit={canEdit}
        canDelete={canDeleteWorkflow(actor)}
      />
    </AppShell>
  );
}
