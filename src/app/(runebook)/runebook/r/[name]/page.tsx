import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CodeBlock } from "@/components/code-block";
import { CapabilityList } from "@/components/runebook/capability-list";
import { connectDb, isDbConfigured } from "@/lib/db";
import { Rune } from "@/lib/db/models/rune";
import { RuneVersion } from "@/lib/db/models/rune-version";
import { User } from "@/lib/db/models/user";
import { formatHash } from "@/lib/manifest";
import { runeNameToUrl, urlToRuneName } from "@/lib/runebook-urls";

interface Params {
  name: string;
}

export const dynamic = "force-dynamic";

async function loadRune(rawName: string) {
  if (!isDbConfigured()) return null;
  await connectDb();
  const name = urlToRuneName(rawName).toLowerCase();

  const rune = await Rune.findOne({ name }).lean();
  if (!rune) return null;

  const versions = await RuneVersion.find({ runeId: rune._id })
    .sort({ publishedAt: -1, createdAt: -1 })
    .lean();

  const ownerIds = rune.owners.map((o) => o.userId);
  const owners = await User.find({ _id: { $in: ownerIds } }).lean();
  const ownersById = new Map(owners.map((u) => [String(u._id), u]));

  return { rune, versions, ownersById };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { name } = await params;
  const decoded = urlToRuneName(name);
  return {
    title: decoded,
    description: `Rune: ${decoded}`,
  };
}

export default async function RuneDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { name } = await params;
  const loaded = await loadRune(name);
  if (!loaded) notFound();

  const { rune, versions, ownersById } = loaded;
  const latest =
    (rune.latestVersionId
      ? versions.find((v) => String(v._id) === String(rune.latestVersionId))
      : null) ??
    versions.find((v) => v.status === "active") ??
    null;
  const visibleVersions = versions.filter((v) => v.status !== "pending");

  return (
    <section className="mx-auto max-w-4xl px-6 pt-12 pb-24 sm:pt-16 sm:pb-32">
      <p className="mb-3 font-mono text-xs text-muted-foreground">
        runebook · rune
      </p>
      <h1 className="break-all font-mono text-2xl text-display sm:text-3xl">
        {rune.name}
      </h1>
      {rune.description && (
        <p className="mt-4 max-w-prose text-sm text-foreground">
          {rune.description}
        </p>
      )}

      <div className="mt-12 divide-y divide-border">
        {latest && (
          <article className="py-10">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-mono text-xs text-muted-foreground">
                install
              </h2>
              <span className="font-mono text-xs text-muted-foreground">
                v{latest.version}
              </span>
            </div>
            <div className="mt-4">
              <CodeBlock
                code={`rune add ${rune.name}@${latest.version}`}
                lang="shell"
              />
            </div>
            <p className="mt-3 truncate font-mono text-xs text-muted-foreground">
              manifest hash: <code>{formatHash(latest.manifestHash)}</code>
            </p>
          </article>
        )}

        {latest && (
          <article className="py-10">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-mono text-xs text-muted-foreground">
                capabilities
              </h2>
              <span className="font-mono text-xs text-muted-foreground">
                {latest.capabilities.length} declared
              </span>
            </div>
            <p className="mt-3 max-w-prose text-sm text-foreground">
              These are the host privileges this Rune asks for. Operators should
              review the list before installing on a production server.
            </p>
            <div className="mt-6">
              <CapabilityList capabilities={latest.capabilities} />
            </div>
          </article>
        )}

        <article className="py-10">
          <h2 className="font-mono text-xs text-muted-foreground">versions</h2>
          {visibleVersions.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No versions published yet.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {visibleVersions.map((v) => (
                <li
                  key={v.version}
                  className="flex items-baseline justify-between gap-4 py-3"
                >
                  <Link
                    href={`/runebook/r/${runeNameToUrl(rune.name)}/v/${v.version}`}
                    className="group flex items-baseline gap-3"
                  >
                    <span className="font-mono text-sm text-foreground transition-colors group-hover:text-primary-hover">
                      v{v.version}
                    </span>
                    {v.version === rune.latestVersion && (
                      <span className="font-mono text-[10px] uppercase tracking-wider text-primary">
                        latest
                      </span>
                    )}
                    {v.status === "yanked" && (
                      <span className="font-mono text-[10px] uppercase tracking-wider text-destructive">
                        yanked
                      </span>
                    )}
                  </Link>
                  <span className="font-mono text-xs text-muted-foreground">
                    {v.publishedAt instanceof Date
                      ? v.publishedAt.toISOString().slice(0, 10)
                      : "-"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="py-10">
          <h2 className="font-mono text-xs text-muted-foreground">metadata</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            {latest?.language && (
              <MetaRow label="language" value={latest.language} />
            )}
            {rune.license && <MetaRow label="license" value={rune.license} />}
            {rune.homepage && (
              <MetaRow
                label="homepage"
                value={
                  <a
                    href={rune.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-primary transition-colors hover:text-primary-hover"
                  >
                    {rune.homepage}
                  </a>
                }
              />
            )}
            {rune.repository && (
              <MetaRow
                label="repository"
                value={
                  <a
                    href={rune.repository}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-primary transition-colors hover:text-primary-hover"
                  >
                    {rune.repository}
                  </a>
                }
              />
            )}
            <MetaRow
              label="owners"
              value={
                <span className="flex flex-wrap gap-2">
                  {rune.owners.map((o) => {
                    const u = ownersById.get(String(o.userId));
                    if (!u?.username) return null;
                    return (
                      <Link
                        key={u.username}
                        href={`/runebook/u/${u.username}`}
                        className="font-mono text-sm text-foreground transition-colors hover:text-primary-hover"
                      >
                        @{u.username}
                      </Link>
                    );
                  })}
                </span>
              }
            />
            <MetaRow
              label="published"
              value={
                rune.createdAt instanceof Date
                  ? rune.createdAt.toISOString().slice(0, 10)
                  : "-"
              }
            />
            {rune.totalDownloads !== undefined && rune.totalDownloads > 0 && (
              <MetaRow label="downloads" value={String(rune.totalDownloads)} />
            )}
          </dl>
        </article>
      </div>
    </section>
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
