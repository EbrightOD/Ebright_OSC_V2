import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/app/components/AppShell";
import InductionControlCentre from "@/app/induction/components/InductionControlCentre";
import { canManageInductions } from "@/app/induction/roles";
import {
  listAllInductionProfiles,
  listInductionEligibleEmployees,
  listPendingInductionRequests,
} from "@/app/induction/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Induction Control Centre",
};

export default async function InductionControlCentrePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const actor = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { role: { select: { role_type: true } } },
  });
  if (!canManageInductions(actor?.role?.role_type ?? null)) {
    redirect("/dashboards/hrms");
  }

  const [employees, profiles, requests] = await Promise.all([
    listInductionEligibleEmployees(),
    listAllInductionProfiles(),
    listPendingInductionRequests(),
  ]);

  const userEmail = session.user.email;
  const userRole = actor?.role?.role_type ?? "";
  const userName = session.user.name ?? null;

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <InductionControlCentre
        employees={employees}
        profiles={profiles}
        requests={requests}
      />
    </AppShell>
  );
}
