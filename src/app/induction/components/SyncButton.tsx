"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function SyncButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const handleSync = async () => {
    setBusy(true);
    setMessage("Syncing…");

    try {
      const response = await fetch("/api/induction/sync", { method: "POST" });
      const data = await response.json();

      if (response.ok && data.success) {
        setMessage(`✓ Synced ${data.result.synced} candidates`);
        startTransition(() => router.refresh());
      } else {
        const detail =
          data.details ||
          data.error ||
          (Array.isArray(data.errors) && data.errors.length > 0
            ? data.errors[0]
            : null) ||
          `HTTP ${response.status}`;
        setMessage(`✗ ${detail}`);
        console.error("[sync] failure response:", data);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      setMessage(`✗ ${msg}`);
    } finally {
      setBusy(false);
      setTimeout(() => setMessage(""), 8000);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleSync}
        disabled={busy || isPending}
        className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {busy ? "Syncing…" : "Sync from ebrightleads"}
      </button>
      {message && (
        <p
          className="max-w-md break-words text-right text-xs text-gray-700"
          title={message}
        >
          {message}
        </p>
      )}
    </div>
  );
}
