"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError, apiFetch } from "@/lib/api/client";

interface VersionRef {
  version: string;
  status: string;
}

interface Props {
  name: string;
  versions: VersionRef[];
}

export function RuneAdminActions({ name, versions }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [yankVersion, setYankVersion] = useState<string>(
    versions[0]?.version ?? "",
  );
  const [yankReason, setYankReason] = useState("");
  const [yankAllReason, setYankAllReason] = useState("");

  const activeVersions = versions.filter((v) => v.status === "active");

  const yankOne = async () => {
    if (!yankVersion) return;
    if (!yankReason.trim()) {
      setError("A reason is required.");
      return;
    }
    setBusy("yank-one");
    setError(null);
    try {
      await apiFetch(
        `/api/v1/admin/runes/${encodeURIComponent(name)}/versions/${encodeURIComponent(
          yankVersion,
        )}/yank`,
        { method: "POST", body: JSON.stringify({ reason: yankReason.trim() }) },
      );
      setYankReason("");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed");
    } finally {
      setBusy(null);
    }
  };

  const yankAll = async () => {
    if (!yankAllReason.trim()) {
      setError("A reason is required.");
      return;
    }
    if (
      !confirm(
        `Yank every active version of ${name}? Installed copies keep working; the default resolver hides them.`,
      )
    ) {
      return;
    }
    setBusy("yank-all");
    setError(null);
    try {
      await apiFetch(
        `/api/v1/admin/runes/${encodeURIComponent(name)}/yank-all`,
        {
          method: "POST",
          body: JSON.stringify({ reason: yankAllReason.trim() }),
        },
      );
      setYankAllReason("");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed");
    } finally {
      setBusy(null);
    }
  };

  const deleteRune = async () => {
    const confirmation = prompt(
      `Hard-delete ${name}. This removes the Rune and every version. Blobs remain in storage (GC will reclaim orphans). Type "${name}" to confirm.`,
    );
    if (confirmation !== name) return;
    setBusy("delete");
    setError(null);
    try {
      await apiFetch(`/api/v1/admin/runes/${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      router.push("/admin/runes");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed");
      setBusy(null);
    }
  };

  return (
    <section className="space-y-6 rounded border border-destructive/40 bg-destructive/5 px-5 py-4">
      <h2 className="font-mono text-xs text-destructive">platform actions</h2>

      {error && <p className="font-mono text-xs text-destructive">{error}</p>}

      <div className="space-y-3">
        <p className="font-mono text-xs text-foreground">
          yank a single version
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="block text-[11px] text-muted-foreground">
              version
            </span>
            <select
              value={yankVersion}
              onChange={(e) => setYankVersion(e.target.value)}
              disabled={activeVersions.length === 0}
              className="mt-1 rounded border border-border bg-background px-3 py-2 font-mono text-xs outline-none focus:border-primary disabled:opacity-50"
            >
              {activeVersions.length === 0 ? (
                <option value="">no active versions</option>
              ) : (
                activeVersions.map((v) => (
                  <option key={v.version} value={v.version}>
                    v{v.version}
                  </option>
                ))
              )}
            </select>
          </label>
          <label className="block flex-1 min-w-[16rem]">
            <span className="block text-[11px] text-muted-foreground">
              reason
            </span>
            <input
              type="text"
              value={yankReason}
              onChange={(e) => setYankReason(e.target.value)}
              maxLength={280}
              placeholder="malware / TOS / abuse / ..."
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
          <button
            type="button"
            onClick={yankOne}
            disabled={busy !== null || activeVersions.length === 0}
            className="rounded border border-destructive/40 px-3 py-2 font-mono text-xs text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
          >
            {busy === "yank-one" ? "yanking..." : "yank version"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <p className="font-mono text-xs text-foreground">yank every version</p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block flex-1 min-w-[16rem]">
            <span className="block text-[11px] text-muted-foreground">
              reason
            </span>
            <input
              type="text"
              value={yankAllReason}
              onChange={(e) => setYankAllReason(e.target.value)}
              maxLength={280}
              placeholder="visible to every operator who has this Rune installed"
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
          <button
            type="button"
            onClick={yankAll}
            disabled={busy !== null || activeVersions.length === 0}
            className="rounded border border-destructive/40 px-3 py-2 font-mono text-xs text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
          >
            {busy === "yank-all" ? "yanking..." : "yank all versions"}
          </button>
        </div>
      </div>

      <div className="space-y-3 border-t border-destructive/40 pt-5">
        <p className="font-mono text-xs text-foreground">hard delete</p>
        <p className="text-xs text-muted-foreground">
          Wipe the Rune record and every version. Pinned installs by manifest
          hash continue working until a GC sweep reclaims their blobs. Prefer
          yank when the goal is &ldquo;hide it&rdquo; rather than &ldquo;forget
          it.&rdquo;
        </p>
        <button
          type="button"
          onClick={deleteRune}
          disabled={busy !== null}
          className="rounded border border-destructive/40 px-3 py-2 font-mono text-xs text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
        >
          {busy === "delete" ? "deleting..." : "delete rune"}
        </button>
      </div>
    </section>
  );
}
