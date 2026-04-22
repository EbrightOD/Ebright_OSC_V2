export type RoleType = "superadmin" | "ceo" | "admin" | "staff";

const ROLE_LABEL: Record<string, string> = {
  superadmin: "Superadmin",
  ceo: "CEO",
  admin: "Admin",
  staff: "Staff",
};

export function formatRoleLabel(role: string | null | undefined): string {
  if (!role) return "User";
  return ROLE_LABEL[role] ?? role.charAt(0).toUpperCase() + role.slice(1);
}

export function getAvatarInitials(nameOrEmail: string | null | undefined): string {
  const src = (nameOrEmail ?? "").trim();
  if (!src) return "U";
  const base = src.includes("@") ? src.split("@")[0] : src;
  const parts = base.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

export const SUPERADMIN_DEPARTMENT_NAME = "Optimisation Department";

export function displayNameFor(
  role: string | null | undefined,
  name: string | null | undefined,
  email: string | null | undefined,
): string {
  if (role === "superadmin") return SUPERADMIN_DEPARTMENT_NAME;
  const trimmed = (name ?? "").trim();
  if (trimmed) return trimmed;
  if (email) return email.split("@")[0];
  return "User";
}
