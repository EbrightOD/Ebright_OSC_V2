"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import DashboardHome from "@/app/components/DashboardHome";
import EmployeeSelfServiceDashboard from "@/app/components/EmployeeSelfServiceDashboard";
import AppShell from "@/app/components/AppShell";
import HodPendingAlert from "@/app/components/HodPendingAlert";
import OngoingTasksWidget from "@/app/components/OngoingTasksWidget";

export default function HomePage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login");
    },
  });

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-blue-600 font-semibold text-lg">
        Loading Dashboard...
      </div>
    );
  }

  const userEmail = session?.user?.email || "";
  const userRole = (session?.user as { role?: string } | undefined)?.role || "USER";
  const userPosition = (session?.user as { position?: string } | undefined)?.position ?? "";
  const userName = session?.user?.name ?? null;

  // role_type "staff" corresponds to role_id = 4 in the DB.
  const isStaff = userRole.toLowerCase() === "staff";

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <HodPendingAlert position={userPosition} />
      {isStaff ? (
        <EmployeeSelfServiceDashboard userName={userName} userEmail={userEmail} />
      ) : (
        <DashboardHome userRole={userRole} userEmail={userEmail} />
      )}
      <div className="max-w-7xl mx-auto px-6 pb-10">
        <OngoingTasksWidget />
      </div>
    </AppShell>
  );
}
