import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { prisma } from "@/lib/prisma";
import { canManageInductions } from "@/app/induction/roles";

export const dynamic = "force-dynamic";

export default async function InductionIndexPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const actor = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { role: { select: { role_type: true } } },
  });

  if (canManageInductions(actor?.role?.role_type ?? null)) {
    redirect("/induction/control-centre");
  }
  redirect("/dashboards/hrms");
}
