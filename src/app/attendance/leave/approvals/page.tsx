import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/app/components/AppShell";
import LeaveApprovalsView, {
  type HodPendingItem,
  type HrApprovedItem,
} from "@/app/components/LeaveApprovalsView";
import { getActiveDepartmentId, loadHodPending, loadHrApproved } from "../approval-queries";

export const dynamic = "force-dynamic";

export default async function LeaveApprovalsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const role = (session.user as { role?: string } | undefined)?.role ?? "";
  if (role !== "hod" && role !== "hr") redirect("/home");
  const mode: "hod" | "hr" = role === "hod" ? "hod" : "hr";

  const me = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { user_id: true },
  });
  if (!me) redirect("/login");

  let hodItems: HodPendingItem[] = [];
  let hrItems: HrApprovedItem[] = [];
  if (mode === "hod") {
    const departmentId = await getActiveDepartmentId(me.user_id);
    hodItems = departmentId != null ? await loadHodPending(departmentId) : [];
  } else {
    hrItems = await loadHrApproved();
  }

  const userEmail = session.user.email ?? "";
  const userName = session.user.name ?? null;

  return (
    <AppShell email={userEmail} role={role} name={userName}>
      <LeaveApprovalsView mode={mode} hodItems={hodItems} hrItems={hrItems} />
    </AppShell>
  );
}
