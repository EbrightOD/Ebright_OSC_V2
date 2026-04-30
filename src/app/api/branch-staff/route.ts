import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { prisma } from "@/lib/prisma";

// Roles that can be assigned in the manpower grid (BM also fills the
// Manager-on-Duty cell). v2 stores role_id rather than the old free-text role,
// so we resolve role IDs at runtime from the `role` table.
const ASSIGNABLE_ROLE_TYPES = ["BM", "FT COACH", "PT COACH"];

// Shape consumed by the planning page: { id, name, branch (full name), role }.
// `role` follows the old convention where a branch manager is rendered as
// `branch_manager_<lowercased first 3 letters of branch name>`.
interface StaffPayload {
  id: number;
  name: string;
  branch: string;
  role: string | null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    // Resolve assignable role IDs once.
    const roles = await prisma.role.findMany({
      where: { role_type: { in: ASSIGNABLE_ROLE_TYPES } },
      select: { role_id: true, role_type: true },
    });
    const roleIds = roles.map((r) => r.role_id);
    if (roleIds.length === 0) return NextResponse.json([]);

    // Pull active staff with at least one employment row that has a branch.
    // We project the latest employment (highest employment_id) so transfers
    // surface immediately.
    const users = await prisma.users.findMany({
      where: {
        status: "active",
        deleted_at: null,
        // We don't filter role_id at the user level because role_id on `users`
        // is the auth role (e.g. STAFF=4), not the position. The BM/coach
        // distinction lives on `employment.position`.
        employment: { some: { branch_id: { not: null } } },
      },
      select: {
        user_id: true,
        user_profile: { select: { full_name: true, nick_name: true } },
        employment: {
          orderBy: { employment_id: "desc" },
          take: 1,
          select: {
            position: true,
            branch: { select: { branch_name: true } },
          },
        },
      },
    });

    const payload: StaffPayload[] = users.flatMap((u) => {
      const emp = u.employment[0];
      if (!emp?.branch?.branch_name) return [];
      const position = emp.position?.toUpperCase().trim() ?? "";
      // Only include people who can actually be assigned in the grid.
      if (!ASSIGNABLE_ROLE_TYPES.includes(position)) return [];
      const displayName =
        u.user_profile?.nick_name?.trim() ||
        u.user_profile?.full_name?.trim();
      if (!displayName) return [];
      const branchName = emp.branch.branch_name;
      const role =
        position === "BM"
          ? `branch_manager_${branchName.substring(0, 3).toLowerCase()}`
          : null;
      return [
        {
          id: u.user_id,
          name: displayName,
          branch: branchName,
          role,
        },
      ];
    });

    return NextResponse.json(payload);
  } catch (err) {
    console.error("[GET /api/branch-staff]", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
