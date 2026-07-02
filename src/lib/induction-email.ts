import "server-only";
import { Resend } from "resend";

/**
 * Resend client — lazy so the module loads cleanly when the env var
 * isn't set in dev. Throws at send-time if the key is missing, which
 * surfaces a clear error rather than a silent failure.
 */
let _resend: Resend | null = null;
function resendClient(): Resend {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error(
      "RESEND_API_KEY is not configured — set it in the server env to enable real email sending.",
    );
  }
  _resend = new Resend(key);
  return _resend;
}

function fromAddress(): string {
  return process.env.RESEND_FROM_EMAIL ?? "noreply@ebright.my";
}

export interface OnboardingWelcomeEmailParams {
  to: string;
  candidateName: string;
  username: string;
  tempPassword: string;
  loginUrl: string;
}

/**
 * "Welcome to eBright" onboarding email — per spec template. Sends via
 * Resend in production; in dev (no RESEND_API_KEY) it logs to console
 * and resolves successfully so the rest of the flow keeps working.
 *
 * Returns { sent } so the caller (cron job) can tell whether to mark
 * email_sent_at on the induction_profile row.
 */
export async function sendOnboardingWelcomeEmail(
  params: OnboardingWelcomeEmailParams,
): Promise<{ sent: boolean; messageId?: string }> {
  const subject = "Welcome to eBright — Your Onboarding Details";

  const greetingName = params.candidateName.split(/\s+/)[0] ?? params.candidateName;

  // Plain-text version (always rendered as fallback)
  const text = [
    `Hi ${greetingName},`,
    "",
    "Welcome to eBright Onboarding!",
    "",
    "You will be doing Induction Training as part of your onboarding journey. Induction Training is where you will learn about eBright's culture, processes, and everything you need to know before you get started.",
    "",
    "Please log in to our portal to begin:",
    "",
    `Username: ${params.username}`,
    `Password: ${params.tempPassword}`,
    "",
    `Log in here: ${params.loginUrl}`,
    "",
    "See you on the inside!",
    "eBright HR Team",
  ].join("\n");

  // HTML version with a "Log In to Portal" button
  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#0f172a;background:#f8fafc;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
          <tr><td style="padding:32px;">
            <h1 style="margin:0 0 16px;font-size:20px;line-height:1.35;color:#0f172a;">Hi ${escapeHtml(greetingName)},</h1>
            <p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:#334155;">Welcome to eBright Onboarding!</p>
            <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#334155;">You will be doing <strong>Induction Training</strong> as part of your onboarding journey. Induction Training is where you will learn about eBright's culture, processes, and everything you need to know before you get started.</p>
            <p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:#334155;">Please log in to our portal to begin:</p>
            <div style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px;margin:0 0 24px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;color:#0f172a;">
              <div><strong style="color:#475569;">Username:</strong> ${escapeHtml(params.username)}</div>
              <div style="margin-top:4px;"><strong style="color:#475569;">Password:</strong> ${escapeHtml(params.tempPassword)}</div>
            </div>
            <div style="text-align:center;margin:0 0 24px;">
              <a href="${escapeHtml(params.loginUrl)}" style="display:inline-block;background:#2563eb;color:#ffffff;font-weight:600;font-size:14px;text-decoration:none;padding:12px 24px;border-radius:8px;">Log In to Portal</a>
            </div>
            <p style="margin:0 0 4px;font-size:15px;line-height:1.55;color:#334155;">See you on the inside!</p>
            <p style="margin:0;font-size:15px;line-height:1.55;color:#334155;">eBright HR Team</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  // Dev fallback when no key set: log + return sent:false so the cron
  // doesn't mark email_sent_at (lets the operator wire the env later
  // and have it pick up where it left off).
  if (!process.env.RESEND_API_KEY) {
    console.info(
      "[induction] RESEND_API_KEY not set — mock send only:",
      JSON.stringify({ to: params.to, subject }),
    );
    return { sent: false };
  }

  const res = await resendClient().emails.send({
    from: fromAddress(),
    to: params.to,
    subject,
    text,
    html,
  });

  if (res.error) {
    throw new Error(`Resend send failed: ${res.error.message}`);
  }
  return { sent: true, messageId: res.data?.id };
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export interface DayZeroKitParams {
  employeeEmail: string;
  employeeName: string;
  inductionLink: string;
  buddyName?: string | null;
  buddyEmail?: string | null;
  departmentName?: string | null;
  startDate: string;
}

export async function sendDayZeroKitEmail(params: DayZeroKitParams): Promise<void> {
  const subject = `Welcome to Ebright! Your onboarding starts ${params.startDate}`;
  const body = [
    `Hi ${params.employeeName},`,
    "",
    `We're excited to have you join${params.departmentName ? ` ${params.departmentName}` : ""} on ${params.startDate}.`,
    "",
    "Your personal onboarding checklist:",
    params.inductionLink,
    "",
    params.buddyName
      ? `Your buddy: ${params.buddyName}${params.buddyEmail ? ` (${params.buddyEmail})` : ""}`
      : "",
    "",
    "This week you'll cover:",
    " • IT equipment setup",
    " • Compliance training",
    " • Team introduction",
    "",
    "Questions? Reply to this email or contact HR.",
    "",
    "Welcome aboard!",
    "HR Team",
  ]
    .filter(Boolean)
    .join("\n");

  console.info(
    "[induction] Day-0 kit email queued:",
    JSON.stringify({ to: params.employeeEmail, subject, body }),
  );
}

export interface BuddyNotificationParams {
  buddyUserId: number;
  buddyEmail?: string | null;
  newHireName: string;
  startDate: Date;
  departmentName?: string | null;
}

export async function notifyBuddy(params: BuddyNotificationParams): Promise<void> {
  const dateStr = params.startDate.toISOString().slice(0, 10);
  console.info(
    "[induction] Buddy notification queued:",
    JSON.stringify({
      buddyUserId: params.buddyUserId,
      buddyEmail: params.buddyEmail ?? null,
      newHire: params.newHireName,
      startDate: dateStr,
      department: params.departmentName ?? null,
      message: `You've been assigned as buddy for ${params.newHireName} starting ${dateStr}.`,
    }),
  );
}
