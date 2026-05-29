import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RuneListItem } from "@/components/runebook/rune-list-item";
import { currentUser } from "@/lib/auth/server";
import { connectDb, isDbConfigured } from "@/lib/db";
import { Org } from "@/lib/db/models/org";
import { OrgMember } from "@/lib/db/models/org-member";
import { Rune } from "@/lib/db/models/rune";
import { RuneVersion } from "@/lib/db/models/rune-version";

interface Params {
  name: string;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { name } = await params;
  return { title: `@${name}` };
}

export default async function OrgProfilePage({
  params,
}: {
  params: Promise<Params>;
}) {
  if (!isDbConfigured()) notFound();
  const { name } = await params;
  await connectDb();
  const org = await Org.findOne({ name: name.toLowerCase() }).lean();
  if (!org) notFound();
  if (org.suspendedAt) notFound();

  // Members (and platform staff) see private Runes too.
  const me = await currentUser();
  const isStaff = Boolean(me?.doc.platformRole);
  const isMember = me
    ? Boolean(await OrgMember.exists({ orgId: org._id, userId: me.doc._id }))
    : false;
  const canSeePrivate = isMember || isStaff;

  const filter: Record<string, unknown> = {
    ownerKind: "org",
    ownerId: org._id,
    latestVersionId: { $exists: true },
  };
  if (!canSeePrivate) filter.visibility = "public";

  const [memberCount, runes] = await Promise.all([
    OrgMember.countDocuments({ orgId: org._id }),
    Rune.find(filter).sort({ updatedAt: -1 }).lean(),
  ]);

  const versionIds = runes
    .map((r) => r.latestVersionId)
    .filter((id): id is NonNullable<typeof id> => Boolean(id));
  const versions = await RuneVersion.find({
    _id: { $in: versionIds },
  }).lean();
  const byId = new Map(versions.map((v) => [String(v._id), v]));

  const privateCount = runes.filter((r) => r.visibility === "private").length;

  return (
    <section className="mx-auto max-w-4xl px-6 pt-12 pb-24 sm:pt-16 sm:pb-32">
      <p className="mb-3 font-mono text-xs text-muted-foreground">
        runebook · org
      </p>
      <div className="flex flex-wrap items-baseline gap-3">
        <h1 className="break-all font-mono text-2xl text-display sm:text-3xl">
          @{org.name}
        </h1>
        <span className="rounded border border-border bg-muted px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          org
        </span>
      </div>
      {org.displayName && org.displayName !== org.name && (
        <p className="mt-2 text-base text-foreground">{org.displayName}</p>
      )}
      {org.description && (
        <p className="mt-4 max-w-prose text-sm text-foreground">
          {org.description}
        </p>
      )}
      <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
        <span>
          {memberCount} {memberCount === 1 ? "member" : "members"}
        </span>
        {org.homepage && (
          <a
            href={org.homepage}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-primary transition-colors hover:text-primary-hover"
          >
            {org.homepage.replace(/^https?:\/\//, "")}
          </a>
        )}
        <span>
          founded{" "}
          {org.createdAt instanceof Date
            ? org.createdAt.toISOString().slice(0, 10)
            : "-"}
        </span>
      </p>

      <div className="mt-12">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-mono text-xs text-muted-foreground">
            {runes.length} {runes.length === 1 ? "rune" : "runes"}
          </h2>
          {canSeePrivate && privateCount > 0 && (
            <span className="font-mono text-[11px] text-muted-foreground">
              including {privateCount} private
            </span>
          )}
        </div>
        {runes.length === 0 ? (
          <div className="mt-4 rounded border border-dashed border-border px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No Runes published under <code>@{org.name}/*</code> yet.
            </p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {runes.map((r) => {
              const v = r.latestVersionId
                ? byId.get(String(r.latestVersionId))
                : undefined;
              return (
                <RuneListItem
                  key={r.name}
                  data={{
                    name: r.name,
                    description: r.description ?? null,
                    latestVersion: r.latestVersion ?? null,
                    language: v?.language ?? null,
                    capabilities: v?.capabilities ?? [],
                    totalDownloads: r.totalDownloads ?? 0,
                    updatedAt:
                      r.updatedAt instanceof Date
                        ? r.updatedAt.toISOString()
                        : null,
                  }}
                  visibility={
                    (r.visibility as "public" | "private") ?? "public"
                  }
                  isLibrary={r.isLibrary === true}
                />
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
