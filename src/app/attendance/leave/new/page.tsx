import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/app/components/AppShell";
import LeaveFormView, {
  type LeaveTypeOption,
} from "@/app/components/LeaveFormView";

export const dynamic = "force-dynamic";

export default async function NewLeavePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const types = await prisma.leave_types.findMany({
    orderBy: { name: "asc" },
    select: { leave_type_id: true, leave_type_code: true, name: true },
  });

  const options: LeaveTypeOption[] = types.map((t) => ({
    id: t.leave_type_id,
    code: t.leave_type_code,
    name: t.name,
  }));

  const userEmail = session.user?.email ?? "";
  const userRole = (session.user as { role?: string } | undefined)?.role ?? "";
  const userName = session.user?.name ?? null;

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <LeaveFormView leaveTypes={options} />
    </AppShell>
  );
}
