"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { useCreateOrgMutation } from "@/lib/query/orgs";

export function CreateOrgButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const create = useCreateOrgMutation();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await create.mutateAsync({
        name: name.trim().toLowerCase(),
        displayName: displayName.trim() || undefined,
        description: description.trim() || undefined,
      });
      router.push(`/dashboard/orgs/${res.name}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create org");
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 self-start rounded border border-border bg-foreground px-4 py-2 font-mono text-xs text-background transition-colors hover:bg-display"
      >
        + new org
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-sm rounded border border-border bg-muted px-4 py-4"
    >
      <p className="mb-3 font-mono text-xs text-muted-foreground">new org</p>
      <label className="block">
        <span className="block text-xs text-muted-foreground">
          Scope name <span className="text-muted-foreground">(@name)</span>
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          pattern="^[a-z0-9-]{3,32}$"
          placeholder="acme"
          className="mt-1 w-full rounded border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-primary"
        />
      </label>
      <label className="mt-3 block">
        <span className="block text-xs text-muted-foreground">
          Display name
        </span>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Acme Inc."
          maxLength={80}
          className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </label>
      <label className="mt-3 block">
        <span className="block text-xs text-muted-foreground">
          Description (optional)
        </span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={280}
          rows={2}
          className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </label>
      {error && (
        <p className="mt-3 font-mono text-xs text-destructive">{error}</p>
      )}
      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={create.isPending}
          className="rounded border border-border bg-foreground px-3 py-1.5 font-mono text-xs text-background transition-colors hover:bg-display disabled:opacity-50"
        >
          {create.isPending ? "creating..." : "create"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          cancel
        </button>
      </div>
    </form>
  );
}
