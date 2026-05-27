"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api/client";

interface Props {
  userId: string;
  suspended: boolean;
  platformRole: string | null;
}

export function UserAdminActions({ userId, suspended, platformRole }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSuspend = async () => {
    const reason = suspended
      ? null
      : prompt("Suspend reason (visible in audit log):");
    if (!suspended && reason === null) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/v1/admin/users/${userId}/suspend`, {
        method: "POST",
        body: JSON.stringify({
          suspend: !suspended,
          reason: reason ?? undefined,
        }),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const setRole = async (role: "owner" | "admin" | null) => {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/v1/admin/users/${userId}/role`, {
        method: "POST",
        body: JSON.stringify({ role }),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-4 rounded border border-destructive/40 bg-destructive/5 px-5 py-4">
      <h2 className="font-mono text-xs text-destructive">platform actions</h2>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={toggleSuspend}
          disabled={busy}
          className="rounded border border-destructive/40 px-3 py-1.5 font-mono text-xs text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
        >
          {suspended ? "unsuspend" : "suspend"}
        </button>
        <select
          value={platformRole ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            setRole(v === "" ? null : (v as "owner" | "admin"));
          }}
          disabled={busy}
          className="rounded border border-border bg-background px-2 py-1 font-mono text-xs outline-none"
        >
          <option value="">regular user</option>
          <option value="admin">admin</option>
          <option value="owner">owner</option>
        </select>
      </div>
      {error && <p className="font-mono text-xs text-destructive">{error}</p>}
    </section>
  );
}
