import "server-only";

export const FINANCE_ROLE_ID = 3;
export const FINANCE_EMAIL = "finance@ebright.my";
export const SUPERADMIN_ROLE_TYPE = "superadmin";

export interface ReviewerCheck {
  role_id: number;
  email: string | null;
  role_type?: string | null;
}

/**
 * Returns true if the user can view all claims and approve/reject them.
 * Finance user (role_id = 3 AND email = finance@ebright.my) OR superadmin.
 */
export function canReviewClaims(user: ReviewerCheck): boolean {
  const isFinance =
    user.role_id === FINANCE_ROLE_ID && user.email === FINANCE_EMAIL;
  const isSuperadmin = user.role_type?.toLowerCase() === SUPERADMIN_ROLE_TYPE;
  return isFinance || isSuperadmin;
}
