export type RoleType =
  | "superadmin"
  | "ceo"
  | "admin"
  | "staff"
  | "branch"
  | "hr"
  | "od"
  | "hod";

const ROLE_LABEL: Record<RoleType, string> = {
  superadmin: "Superadmin",
  ceo: "CEO",
  admin: "Admin",
  staff: "Staff",
  branch: "Branch",
  hr: "HR",
  od: "OD",
  hod: "HOD",
};

export function formatRoleLabel(role: string | null | undefined): string {
  if (!role) return "User";
  return (ROLE_LABEL as Record<string, string>)[role] ?? role.charAt(0).toUpperCase() + role.slice(1);
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
