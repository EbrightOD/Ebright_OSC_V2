export function titleCaseName(s: string | null | undefined): string {
  if (!s) return "";
  const trimmed = s.trim();
  if (!trimmed) return "";
  return trimmed.toLowerCase().replace(/\b\w+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));
}

export function titleCaseNameOrNull(s: string | null | undefined): string | null {
  const out = titleCaseName(s);
  return out || null;
}

/**
 * Two-letter avatar initials for a name. Uses the first + last word's first
 * letter (or the first two letters of a single word). Returns "?" for empty
 * input. Shared by the onboarding/offboarding candidate avatars.
 */
export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
