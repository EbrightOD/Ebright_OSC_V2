import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AppShell from "@/app/components/AppShell";
import LeaveFormView, {
  type LeaveTypeOption,
} from "@/app/components/LeaveFormView";

export const dynamic = "force-dynamic";

export default async function NewLeavePage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const types = await prisma.leave_types.findMany({
    orderBy: { name: "asc" },
    select: { leave_type_id: true, leave_type_code: true, name: true },
  });

  // Mock per-type balances for now — wire up to a real `leave_balance`
  // table once we track entitlement vs. usage. null = unlimited / not tracked.
  const MOCK_BALANCE: Record<string, number | null> = {
    annual: 12,
    al: 12,
    medical: 10,
    ml: 10,
    emergency: 5,
    el: 5,
    unpaid: null,
    ul: null,
  };

  const options: LeaveTypeOption[] = types.map((t) => {
    const k = (t.leave_type_code ?? t.name ?? "").toLowerCase();
    const balance = k in MOCK_BALANCE
      ? MOCK_BALANCE[k]
      : MOCK_BALANCE[k.split(/\s+/)[0]] ?? null;
    return {
      id: t.leave_type_id,
      code: t.leave_type_code,
      name: t.name,
      balance,
    };
  });

  const userEmail = session.user?.email ?? "";
  const userRole = (session.user as { role?: string } | undefined)?.role ?? "";
  const userName = session.user?.name ?? null;

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <LeaveFormView leaveTypes={options} />
    </AppShell>
  );
}
