import { timingSafeEqual } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOnboardingWelcomeEmail } from "@/lib/induction-email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Cron endpoint — dispatches scheduled onboarding welcome emails.
 *
 * Auth: shared-secret bearer token. The caller (server-side cron job
 * on staging) sets the Authorization header:
 *   curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
 *     https://staging-portal2.ebright.my/api/jobs/send-onboarding-emails
 *
 * What it does:
 *   1. Scans induction_profile rows where
 *        send_email_on <= today (UTC date)
 *        AND email_sent_at IS NULL
 *        AND status = "Sent"
 *        AND pending_email_password IS NOT NULL
 *   2. Sends the welcome email with the stored plaintext temp password
 *      (the same one HR saw in the credential overlay at save time).
 *   3. On success, clears pending_email_password and stamps
 *      email_sent_at — the plaintext is wiped immediately after send
 *      so it lives only between save time and the next cron tick.
 *   4. On failure, leaves the row untouched so the next tick retries.
 *
 * Recommended cron cadence: hourly. Run anytime — UTC date comparison
 * means a row scheduled for today fires on the first tick after 00:00
 * UTC; "earlier" send dates are caught up immediately.
 *
 * Returns 200 with a JSON summary. Per-row failures are collected and
 * logged but never throw to the caller.
 */
function getLoginUrl(): string {
  const base =
    process.env.PUBLIC_PORTAL_URL?.replace(/\/$/, "") ??
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ??
    "";
  return `${base}/login`;
}

export async function POST(req: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET is not configured on the server." },
      { status: 500 },
    );
  }
  const auth = req.headers.get("authorization") ?? "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const expectedBuf = Buffer.from(expectedSecret);
  const providedBuf = Buffer.from(provided);
  const authorized =
    providedBuf.length === expectedBuf.length &&
    timingSafeEqual(providedBuf, expectedBuf);
  if (!authorized) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const due = await prisma.induction_profile.findMany({
    where: {
      status: "Sent",
      email_sent_at: null,
      send_email_on: { lte: today, not: null },
      pending_email_password: { not: null },
    },
    select: {
      id: true,
      user_id: true,
      pending_email_password: true,
      user: {
        select: {
          email: true,
          user_profile: { select: { full_name: true } },
        },
      },
    },
    take: 100, // safety cap per tick
  });

  const loginUrl = getLoginUrl();
  const results: Array<{ profileId: number; ok: boolean; error?: string }> = [];

  for (const row of due) {
    if (!row.pending_email_password) {
      // shouldn't happen given the WHERE clause, but TS narrowing
      results.push({ profileId: row.id, ok: false, error: "no password" });
      continue;
    }
    try {
      const username =
        row.user.email.split("@")[0]?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";

      const result = await sendOnboardingWelcomeEmail({
        to: row.user.email,
        candidateName: row.user.user_profile?.full_name ?? row.user.email,
        username,
        tempPassword: row.pending_email_password,
        loginUrl,
      });

      if (result.sent) {
        await prisma.induction_profile.update({
          where: { id: row.id },
          data: {
            email_sent_at: new Date(),
            // Wipe the plaintext immediately after a successful send
            // so it lives in the DB for the minimum possible window.
            pending_email_password: null,
          },
        });
      }
      results.push({ profileId: row.id, ok: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown send error";
      console.error(`[onboarding-email cron] profile ${row.id} failed:`, msg);
      results.push({ profileId: row.id, ok: false, error: msg });
    }
  }

  return NextResponse.json({
    ok: true,
    processed: results.length,
    succeeded: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
}
