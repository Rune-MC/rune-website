import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RuneListItem } from "@/components/runebook/rune-list-item";
import { connectDb, isDbConfigured } from "@/lib/db";
import { Rune } from "@/lib/db/models/rune";
import { RuneVersion } from "@/lib/db/models/rune-version";
import { User } from "@/lib/db/models/user";

interface Params {
  username: string;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${username}` };
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<Params>;
}) {
  if (!isDbConfigured()) notFound();
  const { username } = await params;
  await connectDb();
  const user = await User.findOne({
    username: username.toLowerCase(),
  }).lean();
  if (!user) notFound();

  const runes = await Rune.find({
    ownerKind: "user",
    ownerId: user._id,
    latestVersionId: { $exists: true },
    visibility: "public",
  })
    .sort({ updatedAt: -1 })
    .lean();

  const versionIds = runes
    .map((r) => r.latestVersionId)
    .filter((id): id is NonNullable<typeof id> => Boolean(id));
  const versions = await RuneVersion.find({
    _id: { $in: versionIds },
  }).lean();
  const byId = new Map(versions.map((v) => [String(v._id), v]));

  return (
    <section className="mx-auto max-w-4xl px-6 pt-12 pb-24 sm:pt-16 sm:pb-32">
      <p className="mb-3 font-mono text-xs text-muted-foreground">
        runebook · user
      </p>
      <h1 className="break-all font-mono text-2xl text-display sm:text-3xl">
        @{user.username}
      </h1>
      <p className="mt-3 font-mono text-xs text-muted-foreground">
        joined{" "}
        {user.createdAt instanceof Date
          ? user.createdAt.toISOString().slice(0, 10)
          : "-"}
      </p>

      <div className="mt-12">
        <h2 className="font-mono text-xs text-muted-foreground">
          {runes.length} {runes.length === 1 ? "rune" : "runes"}
        </h2>
        {runes.length === 0 ? (
          <div className="mt-4 rounded border border-dashed border-border px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No Runes published yet.
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
                />
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
