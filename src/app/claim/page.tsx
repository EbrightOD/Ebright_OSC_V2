import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import AppShell from "@/app/components/AppShell";
import ClaimsView from "@/app/components/ClaimsView";

export const dynamic = "force-dynamic";

export default async function ClaimsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userEmail = session.user?.email ?? "";
  const userRole = (session.user as { role?: string } | undefined)?.role ?? "";
  const userName = session.user?.name ?? null;

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <ClaimsView userName={userName} />
    </AppShell>
  );
}
