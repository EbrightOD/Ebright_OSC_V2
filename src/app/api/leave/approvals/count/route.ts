import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { prisma } from "@/lib/prisma";
import {
  getActiveDepartmentId,
  countHodPending,
  countHrRecentApproved,
} from "@/app/attendance/leave/approval-queries";

export const dynamic = "force-dynamic";

// Role-aware badge count:
//  - hod -> pending requests in their department
//  - hr  -> requests approved in the last 7 days
//  - else -> 0
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ count: 0 });
  const role = (session.user as { role?: string | null }).role ?? null;

  if (role === "hr") {
    return NextResponse.json({ count: await countHrRecentApproved() });
  }

  if (role === "hod") {
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { user_id: true },
    });
    if (!user) return NextResponse.json({ count: 0 });
    const departmentId = await getActiveDepartmentId(user.user_id);
    if (departmentId == null) return NextResponse.json({ count: 0 });
    return NextResponse.json({ count: await countHodPending(departmentId) });
  }

  return NextResponse.json({ count: 0 });
}
