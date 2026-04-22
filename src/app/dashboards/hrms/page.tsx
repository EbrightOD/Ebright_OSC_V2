"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import HrmsDashboard from "@/app/components/HrmsDashboard";
import AppShell from "@/app/components/AppShell";

export default function HrmsPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login");
    },
  });

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-blue-600 font-semibold text-lg">
        Loading HRMS...
      </div>
    );
  }

  const userEmail = session?.user?.email || "";
  const userRole = (session?.user as { role?: string } | undefined)?.role ?? "";
  const userName = session?.user?.name ?? null;

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <HrmsDashboard />
    </AppShell>
  );
}
