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
