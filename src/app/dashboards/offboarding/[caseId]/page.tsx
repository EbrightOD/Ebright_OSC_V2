import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AppShell from "@/app/components/AppShell";
import { OffboardingCaseDetailView } from "./OffboardingCaseDetailView";
import { getOffboardingCaseById } from "@/lib/offboarding/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Offboarding Case",
};

const ALLOWED_ROLES = new Set(["superadmin", "admin", "hr", "od", "hod"]);

interface PageProps {
  params: Promise<{ caseId: string }>;
}

export default async function OffboardingCaseDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const actor = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { role: { select: { role_type: true } } },
  });
  const roleType = (actor?.role?.role_type ?? "").toLowerCase();
  if (!ALLOWED_ROLES.has(roleType)) {
    redirect("/dashboards/hrms");
  }

  const { caseId: caseIdStr } = await params;
  const caseId = Number(caseIdStr);
  if (!Number.isFinite(caseId)) notFound();

  const detail = await getOffboardingCaseById(caseId);
  if (!detail) notFound();

  return (
    <AppShell
      email={session.user.email}
      role={actor?.role?.role_type ?? ""}
      name={session.user.name ?? null}
    >
      <OffboardingCaseDetailView detail={detail} />
    </AppShell>
  );
}
