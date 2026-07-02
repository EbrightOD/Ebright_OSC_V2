import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { canManageInductions } from "@/app/induction/roles";

export const dynamic = "force-dynamic";

export default async function InductionIndexPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const actor = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { role: { select: { role_type: true } } },
  });

  if (canManageInductions(actor?.role?.role_type ?? null)) {
    redirect("/induction/onboarding-dashboard?type=onboarding");
  }
  redirect("/dashboards/hrms");
}
