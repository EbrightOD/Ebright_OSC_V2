import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Resolve a staff member's "supervisor" — the user who will approve the
 * offboarding sign-off in Stage 4 of the workflow.
 *
 * Per spec:
 *   - HQ staff (branch.code === "HQ") → the HOD of their department
 *   - Branch staff (any other branch) → the BM of their branch
 *
 * Returns the supervisor's user_id, or null if no match — in which case
 * HR has to assign manually later (Phase 4+).
 *
 * NOTE: This is a heuristic. The HRMS doesn't have an explicit
 * "reports_to_user_id" column, so we derive supervisors from role +
 * branch + department. If your org sets up a reports_to field later
 * (mentioned as a possible future enhancement), this helper should
 * read from that column first and only fall back to the heuristic.
 */
export async function resolveSupervisorForUser(
  userId: number,
): Promise<number | null> {
  const employment = await prisma.employment.findFirst({
    where: { user_id: userId, status: "active" },
    orderBy: { start_date: "desc" },
    include: {
      branch: { select: { branch_id: true, branch_code: true } },
      department: { select: { department_id: true } },
    },
  });
  if (!employment) return null;

  const isHq = employment.branch?.branch_code === "HQ";

  if (isHq) {
    // HQ → find the HOD of the same department.
    if (!employment.department) return null;
    const hod = await prisma.users.findFirst({
      where: {
        status: "active",
        role: { role_type: { in: ["hod", "HOD"] } },
        employment: {
          some: {
            status: "active",
            department_id: employment.department.department_id,
          },
        },
      },
      select: { user_id: true },
    });
    return hod?.user_id ?? null;
  }

  // Non-HQ → find the BM (Branch Manager) of the same branch. BM in this
  // codebase is captured via the position string on employment, since
  // there's no dedicated role for it.
  if (!employment.branch) return null;
  const bm = await prisma.users.findFirst({
    where: {
      status: "active",
      employment: {
        some: {
          status: "active",
          branch_id: employment.branch.branch_id,
          position: "BM",
        },
      },
    },
    select: { user_id: true },
  });
  return bm?.user_id ?? null;
}
