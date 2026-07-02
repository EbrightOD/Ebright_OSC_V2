import { headers } from "next/headers";

/**
 * Derive the public base URL the user reached us on, server-side.
 *
 * Why: NEXTAUTH_URL on some deployments points at an internal IP
 * (e.g. http://103.x.x.x:3004) instead of the public hostname, which
 * makes any link we build with it unreachable from outside. The
 * reverse proxy sets x-forwarded-host + x-forwarded-proto on the
 * incoming request, so we can rebuild the right URL regardless of how
 * the env var is configured.
 *
 * Fallback order:
 *   1. x-forwarded-proto + x-forwarded-host  (behind a proxy)
 *   2. plain host header + assumed https     (direct hit, HTTPS)
 *   3. NEXTAUTH_URL                          (last resort)
 *   4. "" — caller's problem
 *
 * Note: returns a Promise because next/headers is async in Next.js 16.
 */
export async function getRequestBaseUrl(): Promise<string> {
  const h = await headers();
  const fwdHost = h.get("x-forwarded-host");
  const fwdProto = h.get("x-forwarded-proto");
  if (fwdHost) return `${fwdProto ?? "https"}://${fwdHost}`;

  const host = h.get("host");
  if (host) return `https://${host}`;

  return process.env.NEXTAUTH_URL ?? "";
}
