import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== "superadmin") {
    return NextResponse.json({ count: 0 });
  }
  const count = await prisma.users.count({ where: { status: "pending" } });
  return NextResponse.json({ count });
}
