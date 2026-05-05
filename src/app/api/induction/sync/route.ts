import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { prisma } from "@/lib/prisma";
import { canManageInductions } from "@/app/induction/roles";
import { syncAllFromEbrightLeads } from "@/app/induction/jobs/sync-onboarding";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const actor = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { user_id: true, role: { select: { role_type: true } } },
    });

    if (!canManageInductions(actor?.role?.role_type ?? null)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const all = await syncAllFromEbrightLeads();
    const success =
      all.onboarding.success && all.mc.success && all.al.success;
    const totalSynced =
      all.onboarding.synced + all.mc.synced + all.al.synced;

    return NextResponse.json(
      {
        success,
        message: success ? "Sync completed" : "Sync completed with errors",
        result: {
          synced: totalSynced,
          onboarding: all.onboarding,
          mc: all.mc,
          al: all.al,
        },
      },
      { status: success ? 200 : 500 },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[induction] Sync route error:", msg);
    return NextResponse.json(
      { error: "Failed to sync", details: msg },
      { status: 500 }
    );
  }
}
