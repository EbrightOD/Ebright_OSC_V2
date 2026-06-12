"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import DashboardHome from "@/app/components/DashboardHome";
import EmployeeSelfServiceDashboard from "@/app/components/EmployeeSelfServiceDashboard";
import HrPersonalizedDashboard from "@/app/components/HrPersonalizedDashboard";
import BranchDashboard from "@/app/components/BranchDashboard";
import AppShell from "@/app/components/AppShell";

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
  const userName = session?.user?.name ?? null;
  const branchName =
    (session?.user as { branchName?: string | null } | undefined)?.branchName ?? null;

  const role = userRole.toLowerCase();
  const isStaff = role === "staff"; // role_id = 6
  const isBranch = role === "branch"; // role_id = 4
  const isHr = userEmail.toLowerCase() === "hr@ebright.my";

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      {isHr ? (
        <HrPersonalizedDashboard userName={userName} userEmail={userEmail} />
      ) : isBranch ? (
        <BranchDashboard
          userName={userName}
          userEmail={userEmail}
          branchName={branchName}
        />
      ) : isStaff ? (
        <EmployeeSelfServiceDashboard userName={userName} userEmail={userEmail} />
      ) : (
        <DashboardHome userRole={userRole} userEmail={userEmail} />
      )}
    </AppShell>
  );
}
