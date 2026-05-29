"use client";

import { useSearchParams } from "next/navigation";
import { useSearchRunesQuery } from "@/lib/query/runes";
import { RuneListItem } from "./rune-list-item";
import { RuneListSkeleton } from "./rune-list-skeleton";

export function SearchResults() {
  const params = useSearchParams();
  const q = params.get("q")?.trim() ?? "";
  const { data, isLoading, isError, error } = useSearchRunesQuery(q);

  if (!q) {
    return (
      <div className="rounded border border-dashed border-border px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Type a query in the search bar above to find Runes.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <p className="mb-3 font-mono text-xs text-muted-foreground">
          searching...
        </p>
        <RuneListSkeleton count={4} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-destructive">
        Search failed:{" "}
        {error instanceof Error ? error.message : "unknown error"}
      </p>
    );
  }

  if (data.results.length === 0) {
    return (
      <div className="rounded border border-dashed border-border px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          No Runes match <code>{q}</code>.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 font-mono text-xs text-muted-foreground">
        {data.total} {data.total === 1 ? "result" : "results"} for{" "}
        <code>{q}</code>
      </p>
      <ul className="divide-y divide-border">
        {data.results.map((hit) => (
          <RuneListItem
            key={hit.name}
            data={{
              name: hit.name,
              description: hit.description,
              latestVersion: hit.latest_version,
              language: hit.language,
              capabilities: hit.capabilities,
              totalDownloads: hit.total_downloads,
            }}
            isLibrary={hit.is_library === true}
            visibility={hit.visibility}
          />
        ))}
      </ul>
    </div>
  );
}
