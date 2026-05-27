"use client";

import { Check, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ApiResponse } from "@/lib/api";

interface CreatedToken {
  id: string;
  name: string;
  token: string;
}

type CreatePayload = ApiResponse<CreatedToken>;

export function CreateTokenButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [created, setCreated] = useState<CreatedToken | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setOpen(false);
    setName("");
    setCreated(null);
    setCopied(false);
    setError(null);
    setLoading(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Give it a name so you can identify it later.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/v1/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const payload = (await res.json()) as CreatePayload;
      if (!payload.success) {
        setError(payload.message);
        return;
      }
      setCreated(payload.data);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable; the token is still visible to select
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start rounded bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
      >
        Create token
      </button>
    );
  }

  if (created) {
    return (
      <div className="rounded border border-border bg-muted px-6 py-5 sm:w-96">
        <h2 className="font-mono text-xs text-muted-foreground">
          token created
        </h2>
        <p className="mt-3 text-sm text-foreground">
          Save this token now. It will not be shown again.
        </p>
        <div className="mt-4 flex items-center gap-3 overflow-hidden rounded border border-border bg-background px-3 py-2.5">
          <code className="flex-1 truncate font-mono text-xs text-foreground">
            {created.token}
          </code>
          <button
            type="button"
            onClick={copy}
            className="-my-2 inline-flex items-center gap-1 px-1 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
            aria-label={copied ? "Copied" : "Copy token"}
          >
            {copied ? (
              <>
                <Check className="size-3.5" aria-hidden="true" /> copied
              </>
            ) : (
              <>
                <Copy className="size-3.5" aria-hidden="true" /> copy
              </>
            )}
          </button>
        </div>
        <button
          type="button"
          onClick={reset}
          className="mt-5 rounded border border-border bg-background px-3 py-1.5 text-xs transition-colors hover:bg-muted"
        >
          I've saved it
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded border border-border bg-muted px-6 py-5 sm:w-96"
    >
      <h2 className="font-mono text-xs text-muted-foreground">create token</h2>
      <div className="mt-4 space-y-1.5">
        <label
          htmlFor="token-name"
          className="block font-mono text-xs text-muted-foreground"
        >
          name
        </label>
        <input
          id="token-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="my-laptop"
          maxLength={100}
          autoComplete="off"
          className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create token"}
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded border border-border bg-background px-3 py-1.5 text-xs transition-colors hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
