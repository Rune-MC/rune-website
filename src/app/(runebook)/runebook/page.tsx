import type { Metadata } from "next";
import { RuneListItem } from "@/components/runebook/rune-list-item";
import { SearchBar } from "@/components/runebook/search-bar";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
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
      <h2 className="registry-section-title">Recently published</h2>
      {runes.length === 0 ? (
        <div className="registry-empty">
          <p>There are no public packages to browse yet.</p>
          <Link href="/runebook/publish" className="site-text-link">
            Publish a Rune <ArrowRight size={16} aria-hidden="true" />
          </Link>
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
    <section className="site-shell inner-page registry-width">
      <div className="registry-lead">
        <h1 className="page-heading">Runebook</h1>
        <p className="page-intro">
          Find scripts and libraries for Paper. Review their source and declared
          capabilities before you install a pinned version.
        </p>
        <SearchBar />
      </div>
      <div className="registry-list">
        {empty ? (
          <div className="rounded border border-dashed border-border px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">{empty}</p>
          </div>
        ) : (
          children
        )}
      </div>
      <div className="registry-starter">
        <h2>Build on the Sprint Arena example</h2>
        <p>
          See how a race, a rewards Rune, and an operator dashboard work
          together.
        </p>
        <Link href="/docs/extensions" className="site-text-link">
          Read the extensions guide <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
