import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import AppShell from "@/app/components/AppShell";
import ClaimFormView, {
  type ClaimFormType,
} from "@/app/components/ClaimFormView";

export const dynamic = "force-dynamic";

const VALID_TYPES: ClaimFormType[] = ["sales", "health", "transport"];

export default async function NewClaimTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { type } = await params;
  if (!VALID_TYPES.includes(type as ClaimFormType)) notFound();

  const userEmail = session.user?.email ?? "";
  const userRole = (session.user as { role?: string } | undefined)?.role ?? "";
  const userName = session.user?.name ?? null;

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <ClaimFormView type={type as ClaimFormType} />
    </AppShell>
  );
}
