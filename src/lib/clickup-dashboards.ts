/**
 * Branch code (B01..B21) → ClickUp Dashboard URL.
 *
 * ClickUp does NOT expose dashboards through its public API and blocks iframe
 * embedding (frame-ancestors CSP), so these links are maintained by hand. Open
 * each branch's dashboard in ClickUp, copy the URL from the address bar, and
 * paste it here keyed by the branch code. Branches without an entry simply omit
 * the "Open in ClickUp" link.
 */
export const BRANCH_DASHBOARD_URLS: Record<string, string> = {
  B01: "https://app.clickup.com/3631897/dashboards/3eurt-33956",
  B02: "https://app.clickup.com/3631897/dashboards/3eurt-33976",
  B03: "https://app.clickup.com/3631897/dashboards/3eurt-33996",
  B04: "https://app.clickup.com/3631897/dashboards/3eurt-34016",
  B05: "https://app.clickup.com/3631897/dashboards/3eurt-34036",
  B06: "https://app.clickup.com/3631897/dashboards/3eurt-34056",
  B07: "https://app.clickup.com/3631897/dashboards/3eurt-34076",
  B08: "https://app.clickup.com/3631897/dashboards/3eurt-34096",
  B09: "https://app.clickup.com/3631897/dashboards/3eurt-34116",
  B10: "https://app.clickup.com/3631897/dashboards/3eurt-34136",
  B11: "https://app.clickup.com/3631897/dashboards/3eurt-19536",
  B12: "https://app.clickup.com/3631897/dashboards/3eurt-22156",
  B13: "https://app.clickup.com/3631897/dashboards/3eurt-34156",
  B14: "https://app.clickup.com/3631897/dashboards/3eurt-34176",
  B15: "https://app.clickup.com/3631897/dashboards/3eurt-34196",
  B16: "https://app.clickup.com/3631897/dashboards/3eurt-34216",
  B17: "https://app.clickup.com/3631897/dashboards/3eurt-34236",
  B18: "https://app.clickup.com/3631897/dashboards/3eurt-25156",
  B19: "https://app.clickup.com/3631897/dashboards/3eurt-25256",
  B20: "https://app.clickup.com/3631897/dashboards/3eurt-34256",
  // B21 (Tropicana Sungai Buloh) — no dashboard yet.
};

export function branchDashboardUrl(code: string): string | null {
  return BRANCH_DASHBOARD_URLS[code] ?? null;
}
