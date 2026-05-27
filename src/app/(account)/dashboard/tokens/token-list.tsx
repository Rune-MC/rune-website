"use client";

import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { type TokenSummary, useRevokeTokenMutation } from "@/lib/query/tokens";

interface Props {
  tokens: TokenSummary[];
}

function relative(date: string | null): string {
  if (!date) return "never";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "unknown";
  const diffMs = Date.now() - d.getTime();
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  return d.toISOString().slice(0, 10);
}

export function TokenList({ tokens }: Props) {
  const router = useRouter();
  const revoke = useRevokeTokenMutation();

  const handleRevoke = async (id: string) => {
    if (!confirm("Revoke this token? The CLI using it will stop working.")) {
      return;
    }
    try {
      await revoke.mutateAsync(id);
      router.refresh();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Unexpected error");
    }
  };

  if (tokens.length === 0) {
    return (
      <div className="rounded border border-dashed border-border px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">No tokens issued yet.</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Create one to start publishing Runes from the CLI.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {tokens.map((token) => (
        <li
          key={token.id}
          className="flex items-baseline justify-between gap-4 py-4"
        >
          <div className="min-w-0">
            <p className="font-mono text-sm text-foreground">{token.name}</p>
            <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
              {token.scopes.join(", ")} · created {relative(token.createdAt)} ·
              last used {relative(token.lastUsedAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleRevoke(token.id)}
            disabled={revoke.isPending && revoke.variables === token.id}
            className="-my-2 px-2 py-2 font-mono text-xs text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
          >
            {revoke.isPending && revoke.variables === token.id
              ? "revoking..."
              : "revoke"}
          </button>
        </li>
      ))}
    </ul>
  );
}
