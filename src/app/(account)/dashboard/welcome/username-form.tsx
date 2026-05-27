"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError } from "@/lib/api/client";
import { useClaimUsernameMutation } from "@/lib/query/users";

const USERNAME_PATTERN = /^[a-z0-9-]{3,32}$/;

export function UsernameForm() {
  const router = useRouter();
  const claim = useClaimUsernameMutation();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!USERNAME_PATTERN.test(username)) {
      setError("Lowercase letters, numbers, and hyphens. 3 to 32 characters.");
      return;
    }
    try {
      await claim.mutateAsync({ username });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unexpected error");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <label
          htmlFor="username"
          className="block font-mono text-xs text-muted-foreground"
        >
          username
        </label>
        <div className="flex items-center gap-2 rounded border border-input bg-background px-3 py-2.5 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30">
          <span
            aria-hidden="true"
            className="select-none text-muted-foreground"
          >
            @
          </span>
          <input
            id="username"
            name="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            placeholder="alice"
            autoComplete="off"
            spellCheck={false}
            maxLength={32}
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={claim.isPending || !username}
        className="rounded bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
      >
        {claim.isPending ? "Claiming..." : "Claim username"}
      </button>
    </form>
  );
}
