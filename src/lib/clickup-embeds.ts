/**
 * Embedded ClickUp views shown in /clickup-dashboard/views as iframes.
 *
 * IMPORTANT: these MUST be PUBLIC shared view URLs. In ClickUp open the view →
 * Share → "Share publicly" → copy the public link (it is NOT an
 * app.clickup.com/... URL — private app URLs are blocked from embedding by
 * ClickUp's frame-ancestors CSP and will render blank).
 *
 * Example:
 *   { title: "Branch Operations — Saturday", url: "https://sharing.clickup.com/9012/v/..." },
 */
export interface ClickUpEmbed {
  title: string;
  url: string;
  height?: number;
}

export const CLICKUP_EMBED_VIEWS: ClickUpEmbed[] = [
  // Add public shared ClickUp view URLs here.
];
