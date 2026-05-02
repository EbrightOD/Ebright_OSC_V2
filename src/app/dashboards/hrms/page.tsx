import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import AppShell from "@/app/components/AppShell";
import HrmsDashboard from "@/app/components/HrmsDashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "HRMS",
};

export default async function HrmsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const userEmail = session.user.email;
  const userRole = (session.user as { role?: string }).role ?? "";
  const userName = session.user.name ?? null;

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <HrmsDashboard role={userRole} />
    </AppShell>
  );
}
