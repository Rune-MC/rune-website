import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CodeBlock } from "@/components/code-block";
import { CapabilityList } from "@/components/runebook/capability-list";
import { connectDb, isDbConfigured } from "@/lib/db";
import { Rune } from "@/lib/db/models/rune";
import { RuneVersion } from "@/lib/db/models/rune-version";
import { formatHash } from "@/lib/manifest";
import { urlToRuneName } from "@/lib/runebook-urls";

interface Params {
  name: string;
  version: string;
}

export const dynamic = "force-dynamic";

async function loadVersion(rawName: string, version: string) {
  if (!isDbConfigured()) return null;
  await connectDb();
  const name = urlToRuneName(rawName).toLowerCase();
  const rune = await Rune.findOne({ name }).lean();
  if (!rune) return null;
  const ver = await RuneVersion.findOne({
    runeId: rune._id,
    version,
  }).lean();
  if (!ver || ver.status === "pending") return null;
  return { rune, ver };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { name, version } = await params;
  const decoded = urlToRuneName(name);
  return {
    title: `${decoded} v${version}`,
    description: `Version ${version} of ${decoded}.`,
  };
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  const value = bytes / 1024 ** i;
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[i]}`;
}

export default async function VersionDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { name, version } = await params;
  const loaded = await loadVersion(name, version);
  if (!loaded) notFound();

  const { rune, ver } = loaded;
  const isYanked = ver.status === "yanked";
  const isLatest = rune.latestVersion === ver.version;

  return (
    <>
      {isYanked && (
        <div className="mb-8 rounded border border-destructive/40 bg-destructive/5 px-5 py-4 text-sm">
          <p className="font-mono text-xs uppercase tracking-wider text-destructive">
            yanked
          </p>
          {ver.yankedReason && (
            <p className="mt-2 text-foreground">{ver.yankedReason}</p>
          )}
          <p className="mt-2 text-muted-foreground">
            Installable for operators who pinned this version, but hidden from
            the default resolver.
          </p>
        </div>
      )}

      <div className="divide-y divide-border">
        <article className="py-10 first:pt-0">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-mono text-xs text-muted-foreground">install</h2>
            {isLatest && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-primary">
                latest
              </span>
            )}
          </div>
          <div className="mt-4">
            <CodeBlock
              code={`rune add ${rune.name}@${ver.version}`}
              lang="shell"
            />
          </div>
        </article>

        <article className="py-10">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-mono text-xs text-muted-foreground">
              capabilities
            </h2>
            <span className="font-mono text-xs text-muted-foreground">
              {ver.capabilities.length} declared
            </span>
          </div>
          {ver.capabilities.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No capabilities requested.
            </p>
          ) : (
            <div className="mt-6">
              <CapabilityList capabilities={ver.capabilities} />
            </div>
          )}
        </article>

        <article className="py-10">
          <h2 className="font-mono text-xs text-muted-foreground">metadata</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <MetaRow label="language" value={ver.language} />
            <MetaRow
              label="published"
              value={
                ver.publishedAt instanceof Date
                  ? ver.publishedAt.toISOString().slice(0, 10)
                  : "-"
              }
            />
            <MetaRow
              label="archive"
              value={formatBytes(ver.archiveSizeBytes ?? 0)}
            />
            <MetaRow label="status" value={ver.status} />
          </dl>
          <p className="mt-6 break-all font-mono text-xs text-muted-foreground">
            manifest: <code>{formatHash(ver.manifestHash)}</code>
          </p>
        </article>
      </div>
    </>
  );
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="w-24 shrink-0 font-mono text-xs text-muted-foreground">
        {label}
      </dt>
      <dd className="min-w-0 text-foreground">{value}</dd>
    </div>
  );
}
