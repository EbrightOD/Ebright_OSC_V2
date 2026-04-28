/**
 * instrumentation.ts — Next.js server startup hook.
 *
 * register() is called once when the Node.js server boots. We start the
 * scanner-sync polling loop here so it runs in the same process as the app.
 * Guarded by NEXT_RUNTIME so it doesn't run in the Edge runtime or browser.
 *
 * Docs: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */

const SCANNER_SYNC_INTERVAL_MS = 10_000; // 10 seconds — matches the old app's cadence

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { syncScannerToDb } = await import("@/lib/scanner-sync");

  console.log(
    `[scanner-sync] background poller starting — every ${SCANNER_SYNC_INTERVAL_MS / 1000}s`,
  );

  // Fire one cycle immediately so we don't wait the first interval.
  void syncScannerToDb();

  setInterval(() => {
    void syncScannerToDb();
  }, SCANNER_SYNC_INTERVAL_MS);
}
