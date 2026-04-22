import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import AppShell from "@/app/components/AppShell";
import ApprovalsView from "@/app/components/ApprovalsView";
import { listPendingRegistrations } from "@/lib/employeeQueries";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session) redirect("/login");
  if (role !== "superadmin") redirect("/home");

  const pending = await listPendingRegistrations();

  const userEmail = session.user?.email ?? "";
  const userName = session.user?.name ?? null;

  return (
    <AppShell email={userEmail} role={role} name={userName}>
      <ApprovalsView pending={pending} />
    </AppShell>
  );
}
