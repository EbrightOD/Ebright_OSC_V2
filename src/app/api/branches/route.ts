import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { prisma } from "@/lib/prisma";

const EXCLUDED_BRANCH_IDS = [22];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const branches = await prisma.branch.findMany({
      where: { branch_id: { notIn: EXCLUDED_BRANCH_IDS } },
      select: {
        branch_id: true,
        branch_name: true,
        branch_code: true,
        location: true,
        region: true,
        _count: { select: { employment: true } },
      },
      orderBy: { branch_name: "asc" },
    });

    // Flatten _count into a plain `staff_count` field for easier consumption.
    const payload = branches.map(b => ({
      branch_id: b.branch_id,
      branch_name: b.branch_name,
      branch_code: b.branch_code,
      location: b.location,
      region: b.region,
      staff_count: b._count.employment,
    }));

    return NextResponse.json(payload);
  } catch (err) {
    console.error("[GET /api/branches]", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
