import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CodeBlock } from "@/components/code-block";
import { CapabilityList } from "@/components/runebook/capability-list";
import { currentUser } from "@/lib/auth/server";
import { connectDb, isDbConfigured } from "@/lib/db";
import { Org } from "@/lib/db/models/org";
import { Rune } from "@/lib/db/models/rune";
import { RuneVersion } from "@/lib/db/models/rune-version";
import { User } from "@/lib/db/models/user";
import { formatHash } from "@/lib/manifest";
import { canReadRune } from "@/lib/rune-ownership";
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

  const me = await currentUser();
  const visible = await canReadRune(me?.doc ?? null, rune);
  if (!visible) return null;

  const versions = await RuneVersion.find({ runeId: rune._id })
    .sort({ publishedAt: -1, createdAt: -1 })
    .lean();

  let ownerDisplay: {
    kind: "user" | "org";
    name: string | null;
    href: string | null;
  };
  if (rune.ownerKind === "user") {
    const u = await User.findById(rune.ownerId)
      .select({ username: 1, githubLogin: 1 })
      .lean();
    const name = u?.username ?? u?.githubLogin ?? null;
    ownerDisplay = {
      kind: "user",
      name,
      href: u?.username ? `/runebook/u/${u.username}` : null,
    };
  } else {
    const o = await Org.findById(rune.ownerId).select({ name: 1 }).lean();
    ownerDisplay = {
      kind: "org",
      name: o?.name ?? null,
      href: o?.name ? `/runebook/o/${o.name}` : null,
    };
  }

  return { rune, versions, ownerDisplay };
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

  const { rune, versions, ownerDisplay } = loaded;
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
      <div className="flex flex-wrap items-baseline gap-3">
        <h1 className="break-all font-mono text-2xl text-display sm:text-3xl">
          {rune.name}
        </h1>
        {rune.isLibrary && (
          <span className="rounded border border-primary/40 bg-primary/5 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
            library
          </span>
        )}
        {rune.visibility === "private" && (
          <span className="rounded border border-border bg-muted px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            private
          </span>
        )}
      </div>
      {rune.description && (
        <p className="mt-4 max-w-prose text-sm text-foreground">
          {rune.description}
        </p>
      )}
      {rune.isLibrary && (
        <p className="mt-4 max-w-prose rounded border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
          <strong className="text-foreground">Library Rune.</strong> Boilerplate
          code consumed by other Runes — the host never loads it directly.
          Install it as a dependency of your own Rune and import from it.
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
              label="owner"
              value={
                ownerDisplay.name ? (
                  ownerDisplay.href ? (
                    <Link
                      href={ownerDisplay.href}
                      className="font-mono text-sm text-foreground transition-colors hover:text-primary-hover"
                    >
                      {ownerDisplay.kind === "org" ? "@" : "@"}
                      {ownerDisplay.name}
                      {ownerDisplay.kind === "org" && (
                        <span className="ml-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          org
                        </span>
                      )}
                    </Link>
                  ) : (
                    <span className="font-mono text-sm text-muted-foreground">
                      @{ownerDisplay.name}
                    </span>
                  )
                ) : (
                  <span className="font-mono text-sm text-muted-foreground">
                    unknown
                  </span>
                )
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
