/**
 * Branch code (B01..B21) → ClickUp Dashboard URL.
 *
 * ClickUp does NOT expose dashboards through its public API and blocks iframe
 * embedding (frame-ancestors CSP), so these links are maintained by hand. Open
 * each branch's dashboard in ClickUp, copy the URL from the address bar, and
 * paste it here keyed by the branch code. Branches without an entry show as
 * "link not set" in the UI.
 *
 * Example:
 *   "B20": "https://app.clickup.com/3631897/dashboards/abc-123",
 */
export const BRANCH_DASHBOARD_URLS: Record<string, string> = {
  // Add branch dashboard URLs here, e.g.:
  // "B01": "https://app.clickup.com/3631897/dashboards/...",
};

export function branchDashboardUrl(code: string): string | null {
  return BRANCH_DASHBOARD_URLS[code] ?? null;
}
