import type { Metadata } from "next";
import { RuneListItem } from "@/components/runebook/rune-list-item";
import { connectDb, isDbConfigured } from "@/lib/db";
import { Rune } from "@/lib/db/models/rune";
import { RuneVersion } from "@/lib/db/models/rune-version";

export const metadata: Metadata = {
  title: "Runebook",
  description: "Browse, search, and publish Runes for Paper Minecraft servers.",
};

export const dynamic = "force-dynamic";

interface RuneRow {
  name: string;
  description: string | null;
  latestVersion: string | null;
  language: string | null;
  capabilities: string[];
  totalDownloads: number;
  updatedAt: string | null;
  isLibrary: boolean;
}

async function fetchRecent(limit: number): Promise<RuneRow[]> {
  await connectDb();
  const runes = await Rune.find({
    latestVersionId: { $exists: true },
    visibility: "public",
  })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .lean();

  if (runes.length === 0) return [];

  const versionIds = runes
    .map((r) => r.latestVersionId)
    .filter((id): id is NonNullable<typeof id> => Boolean(id));
  const versions = await RuneVersion.find({ _id: { $in: versionIds } }).lean();
  const byId = new Map(versions.map((v) => [String(v._id), v]));

  return runes.map((r) => {
    const v = r.latestVersionId
      ? byId.get(String(r.latestVersionId))
      : undefined;
    return {
      name: r.name,
      description: r.description ?? null,
      latestVersion: r.latestVersion ?? null,
      language: v?.language ?? null,
      capabilities: v?.capabilities ?? [],
      totalDownloads: r.totalDownloads ?? 0,
      updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : null,
      isLibrary: r.isLibrary === true,
    };
  });
}

export default async function RunebookLandingPage() {
  if (!isDbConfigured()) {
    return <Shell empty="Database isn't configured yet." />;
  }

  const runes = await fetchRecent(20);

  return (
    <Shell>
      <h2 className="font-mono text-xs text-muted-foreground">
        recently published
      </h2>
      {runes.length === 0 ? (
        <div className="mt-6 rounded border border-dashed border-border px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No Runes published yet.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Be the first.{" "}
            <a
              href="/runebook/publish"
              className="text-primary transition-colors hover:text-primary-hover"
            >
              publish a Rune
            </a>
            .
          </p>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {runes.map((r) => (
            <RuneListItem key={r.name} data={r} isLibrary={r.isLibrary} />
          ))}
        </ul>
      )}
    </Shell>
  );
}

function Shell({
  children,
  empty,
}: {
  children?: React.ReactNode;
  empty?: string;
}) {
  return (
    <section className="mx-auto max-w-4xl px-6 pt-12 pb-24 sm:pt-16 sm:pb-32">
      <p className="mb-6 font-mono text-xs text-muted-foreground">runebook</p>
      <h1 className="text-3xl font-medium tracking-tight text-display sm:text-4xl">
        Browse Runes.
      </h1>
      <p className="mt-3 max-w-prose text-sm text-foreground">
        Every Rune ever published, content-addressed and capability-declared.
        Pick one, read the manifest, decide whether to install it.
      </p>
      <div className="mt-16">
        {empty ? (
          <div className="rounded border border-dashed border-border px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">{empty}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
