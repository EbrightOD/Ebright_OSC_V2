import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCombinedUpcomingExits,
  getCombinedUpcomingHires,
  getOwnInductionView,
  listAllInductionProfiles,
  listAllSubstepTemplates,
  listDepartments,
  listInductionEligibleEmployees,
  listPendingInductionRequests,
} from "@/app/induction/queries";
import { listBranches } from "@/lib/employeeQueries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Debug endpoint — runs the same queries the Onboarding Dashboard runs
 * and reports per-query success/failure. Lets us find which call is
 * blowing up without needing server log access.
 *
 * Auth: any signed-in user can hit this (it doesn't expose anything
 * sensitive — just counts + error messages). Remove after debugging.
 *
 * Usage:  GET /api/debug/dashboard-health
 * Returns: { ok, results: [{ name, ok, errorName?, errorMessage?,
 *                            errorStack? (first 5 lines), count? }, ...] }
 */
interface CheckResult {
  name: string;
  ok: boolean;
  count?: number;
  errorName?: string;
  errorMessage?: string;
  errorCode?: string;
  errorStack?: string;
}

async function check(name: string, fn: () => Promise<unknown>): Promise<CheckResult> {
  try {
    const result = await fn();
    let count: number | undefined;
    if (Array.isArray(result)) count = result.length;
    else if (result && typeof result === "object" && "length" in result) {
      count = (result as { length: number }).length;
    }
    return { name, ok: true, count };
  } catch (e) {
    const err = e as { name?: string; message?: string; code?: string; stack?: string };
    return {
      name,
      ok: false,
      errorName: err?.name,
      errorMessage: err?.message,
      errorCode: err?.code,
      errorStack: err?.stack?.split("\n").slice(0, 6).join("\n"),
    };
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }

  const actor = await prisma.users
    .findUnique({
      where: { email: session.user.email },
      select: { user_id: true },
    })
    .catch(() => null);
  const userId = actor?.user_id ?? 0;

  const results: CheckResult[] = [];

  results.push(await check("prisma.users.findUnique (session lookup)", async () => {
    return await prisma.users.findUnique({
      where: { email: session.user!.email! },
      select: { user_id: true, role: { select: { role_type: true } } },
    });
  }));

  results.push(await check("getCombinedUpcomingHires(7, 7)", () =>
    getCombinedUpcomingHires(7, 7),
  ));
  results.push(await check("getCombinedUpcomingExits(14, 0)", () =>
    getCombinedUpcomingExits(14, 0),
  ));
  results.push(await check("getOwnInductionView(actor.user_id)", () =>
    getOwnInductionView(userId),
  ));
  results.push(await check("listAllSubstepTemplates()", () => listAllSubstepTemplates()));
  results.push(await check("listDepartments()", () => listDepartments()));
  results.push(await check("listAllInductionProfiles()", () => listAllInductionProfiles()));
  results.push(await check("listPendingInductionRequests()", () => listPendingInductionRequests()));
  results.push(await check("listBranches()", () => listBranches()));
  results.push(await check("listInductionEligibleEmployees()", () => listInductionEligibleEmployees()));

  // Direct schema probes — confirm the new columns exist
  results.push(await check("induction_profile.findFirst (select new columns)", async () => {
    return await prisma.induction_profile.findFirst({
      select: {
        id: true,
        send_email_on: true,
        email_sent_at: true,
        pending_email_password: true,
      },
    });
  }));

  results.push(await check("induction_profile.count (Sent + new columns filter)", async () => {
    return await prisma.induction_profile.count({
      where: {
        status: "Sent",
        email_sent_at: null,
      },
    });
  }));

  const allOk = results.every((r) => r.ok);
  return NextResponse.json({ ok: allOk, results }, { status: allOk ? 200 : 500 });
}
