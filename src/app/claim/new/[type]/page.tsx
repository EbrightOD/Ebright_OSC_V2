import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/app/components/AppShell";
import ClaimFormView, {
  type ClaimFormType,
} from "@/app/components/ClaimFormView";

export const dynamic = "force-dynamic";

const VALID_TYPES: ClaimFormType[] = ["sales", "health", "transport"];

async function getHealthUsedThisYear(userId: number): Promise<number> {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd = new Date(now.getFullYear(), 11, 31);
  const res = await prisma.claim.aggregate({
    where: {
      user_id: userId,
      claim_type: "health",
      status: { in: ["approved", "disbursed", "received"] },
      claim_date: { gte: yearStart, lte: yearEnd },
    },
    _sum: { approved_amount: true },
  });
  return Number(res._sum.approved_amount ?? 0);
}

export default async function NewClaimTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const { type } = await params;
  if (!VALID_TYPES.includes(type as ClaimFormType)) notFound();

  let healthUsed = 0;
  if (type === "health") {
    const me = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { user_id: true },
    });
    if (me) healthUsed = await getHealthUsedThisYear(me.user_id);
  }

  const userEmail = session.user?.email ?? "";
  const userRole = (session.user as { role?: string } | undefined)?.role ?? "";
  const userName = session.user?.name ?? null;

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <ClaimFormView type={type as ClaimFormType} healthUsed={healthUsed} />
    </AppShell>
  );
}
