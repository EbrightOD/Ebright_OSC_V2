import "server-only";

const MANAGE_INDUCTION_ROLE_TYPES = new Set(["superadmin", "hr", "od"]);

export function canManageInductions(roleType: string | null | undefined): boolean {
  if (!roleType) return false;
  return MANAGE_INDUCTION_ROLE_TYPES.has(roleType.toLowerCase());
}
