"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError, apiFetch } from "@/lib/api/client";

interface Props {
  runeName: string;
  initialVisibility: "public" | "private";
}

export function VisibilityToggle({ runeName, initialVisibility }: Props) {
  const router = useRouter();
  const [visibility, setVisibility] = useState(initialVisibility);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = async () => {
    const next = visibility === "public" ? "private" : "public";
    setBusy(true);
    setError(null);
    try {
      await apiFetch(
        `/api/v1/runes/${encodeURIComponent(runeName)}/visibility`,
        {
          method: "PATCH",
          body: JSON.stringify({ visibility: next }),
        },
      );
      setVisibility(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span className="font-mono text-[11px] text-destructive">{error}</span>
      )}
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-label={`Make ${visibility === "public" ? "private" : "public"}`}
        className={
          visibility === "private"
            ? "inline-flex items-center gap-1.5 rounded border border-border bg-muted px-2 py-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:bg-background disabled:opacity-50"
            : "inline-flex items-center gap-1.5 rounded border border-border bg-background px-2 py-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
        }
      >
        {busy ? "..." : visibility}
      </button>
    </div>
  );
}
