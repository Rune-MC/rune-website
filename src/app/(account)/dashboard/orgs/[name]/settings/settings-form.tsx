"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { useDeleteOrgMutation, useUpdateOrgMutation } from "@/lib/query/orgs";

interface Props {
  orgName: string;
  initial: {
    displayName: string;
    description: string;
    homepage: string;
  };
}

export function SettingsForm({ orgName, initial }: Props) {
  const router = useRouter();
  const update = useUpdateOrgMutation(orgName);
  const del = useDeleteOrgMutation(orgName);

  const [displayName, setDisplayName] = useState(initial.displayName);
  const [description, setDescription] = useState(initial.description);
  const [homepage, setHomepage] = useState(initial.homepage);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    try {
      await update.mutateAsync({
        displayName: displayName.trim() || undefined,
        description: description.trim() ? description.trim() : null,
        homepage: homepage.trim() ? homepage.trim() : null,
      });
      setNotice("Settings saved.");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save");
    }
  };

  const handleDelete = async () => {
    const confirmation = prompt(
      `Type "${orgName}" to confirm deletion. This cannot be undone.`,
    );
    if (confirmation !== orgName) return;
    try {
      await del.mutateAsync();
      router.push("/dashboard/orgs");
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to delete");
    }
  };

  return (
    <div className="space-y-12">
      <form onSubmit={submit} className="max-w-xl space-y-4">
        <h2 className="font-mono text-xs text-muted-foreground">settings</h2>

        <label className="block">
          <span className="block text-xs text-muted-foreground">
            display name
          </span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={80}
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>

        <label className="block">
          <span className="block text-xs text-muted-foreground">
            description
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={280}
            rows={3}
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>

        <label className="block">
          <span className="block text-xs text-muted-foreground">homepage</span>
          <input
            type="url"
            value={homepage}
            onChange={(e) => setHomepage(e.target.value)}
            placeholder="https://acme.dev"
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>

        {error && <p className="font-mono text-xs text-destructive">{error}</p>}
        {notice && <p className="font-mono text-xs text-primary">{notice}</p>}

        <button
          type="submit"
          disabled={update.isPending}
          className="rounded border border-border bg-foreground px-4 py-2 font-mono text-xs text-background transition-colors hover:bg-display disabled:opacity-50"
        >
          {update.isPending ? "saving..." : "save settings"}
        </button>
      </form>

      <section className="max-w-xl rounded border border-destructive/40 bg-destructive/5 px-5 py-4">
        <h2 className="font-mono text-xs text-destructive">danger zone</h2>
        <p className="mt-3 text-sm text-foreground">
          Delete this org. Blocked while any Runes are still owned by it —
          transfer or yank them first. This action cannot be undone.
        </p>
        <button
          type="button"
          onClick={handleDelete}
          disabled={del.isPending}
          className="mt-4 rounded border border-destructive/40 px-4 py-2 font-mono text-xs text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
        >
          {del.isPending ? "deleting..." : "delete org"}
        </button>
      </section>
    </div>
  );
}
