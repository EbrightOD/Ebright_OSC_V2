import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Count of pending induction_request rows for the notification bell.
 *
 * Visible to: superadmin / admin / hr / od (the same role set that can
 * actually Accept/Decline from the Onboarding Dashboard). Everyone
 * else gets { count: 0 } so the bell doesn't show anything.
 */
const VISIBLE_ROLES = new Set(["superadmin", "admin", "hr", "od"]);

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role?.toLowerCase();
  if (!session || !role || !VISIBLE_ROLES.has(role)) {
    return NextResponse.json({ count: 0 });
  }
  const count = await prisma.induction_request.count({ where: { status: "pending" } });
  return NextResponse.json({ count });
}
