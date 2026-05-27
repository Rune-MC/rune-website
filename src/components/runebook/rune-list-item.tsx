import Link from "next/link";
import { runeNameToUrl } from "@/lib/runebook-urls";

export interface RuneListItemData {
  name: string;
  description?: string | null;
  latestVersion?: string | null;
  language?: string | null;
  capabilities?: string[];
  totalDownloads?: number;
  updatedAt?: string | null;
}

function relative(date: string | null | undefined): string | null {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
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

function formatDownloads(n: number): string {
  if (n < 1000) return `${n}`;
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

export function RuneListItem({
  data,
  visibility,
}: {
  data: RuneListItemData;
  visibility?: "public" | "private";
}) {
  const caps = data.capabilities ?? [];
  const meta: string[] = [];
  if (data.language) meta.push(data.language);
  if (caps.length > 0) {
    meta.push(
      caps.slice(0, 3).join(" · ") +
        (caps.length > 3 ? ` +${caps.length - 3}` : ""),
    );
  }
  if (data.totalDownloads && data.totalDownloads > 0) {
    meta.push(`${formatDownloads(data.totalDownloads)} downloads`);
  }
  const rel = relative(data.updatedAt);
  if (rel) meta.push(rel);

  return (
    <li>
      <Link
        href={`/runebook/r/${runeNameToUrl(data.name)}`}
        className="group block py-6"
      >
        <div className="flex items-baseline justify-between gap-4">
          <div className="flex min-w-0 items-baseline gap-2">
            <h3 className="truncate font-mono text-base text-foreground transition-colors group-hover:text-primary-hover">
              {data.name}
            </h3>
            {visibility === "private" && (
              <span className="shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                private
              </span>
            )}
          </div>
          {data.latestVersion && (
            <span className="shrink-0 font-mono text-xs text-muted-foreground">
              v{data.latestVersion}
            </span>
          )}
        </div>
        {data.description && (
          <p className="mt-2 line-clamp-2 text-sm text-foreground">
            {data.description}
          </p>
        )}
        {meta.length > 0 && (
          <p className="mt-3 truncate font-mono text-xs text-muted-foreground">
            {meta.join(" · ")}
          </p>
        )}
      </Link>
    </li>
  );
}
