import "server-only";

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
