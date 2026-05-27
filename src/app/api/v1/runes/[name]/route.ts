import { z } from "zod";
import { Errors, route } from "@/lib/api";
import { connectDb, isDbConfigured } from "@/lib/db";
import { RUNE_NAME_PATTERN, Rune } from "@/lib/db/models/rune";
import { RuneVersion } from "@/lib/db/models/rune-version";
import { User } from "@/lib/db/models/user";
import { formatHash } from "@/lib/manifest";

const params = z.object({
  name: z.string().regex(RUNE_NAME_PATTERN),
});

export const GET = route({
  auth: false,
  params,
  handler: async ({ params }) => {
    if (!isDbConfigured()) {
      throw new Errors.ServiceUnavailable("Database not configured");
    }
    await connectDb();

    const rune = await Rune.findOne({ name: params.name }).lean();
    if (!rune) throw new Errors.NotFound("Rune not found");

    const versions = await RuneVersion.find({ runeId: rune._id })
      .sort({ publishedAt: -1, createdAt: -1 })
      .lean();

    const ownerIds = rune.owners.map((o) => o.userId);
    const owners = await User.find({ _id: { $in: ownerIds } })
      .lean()
      .then((users) => {
        const byId = new Map(users.map((u) => [String(u._id), u]));
        return rune.owners.map((o) => ({
          username: byId.get(String(o.userId))?.username ?? null,
          role: o.role,
          grantedAt: o.grantedAt,
        }));
      });

    return {
      name: rune.name,
      description: rune.description ?? null,
      homepage: rune.homepage ?? null,
      repository: rune.repository ?? null,
      license: rune.license ?? null,
      latest_version: rune.latestVersion ?? null,
      total_downloads: rune.totalDownloads ?? 0,
      created_at:
        rune.createdAt instanceof Date ? rune.createdAt.toISOString() : null,
      updated_at:
        rune.updatedAt instanceof Date ? rune.updatedAt.toISOString() : null,
      owners,
      versions: versions
        .filter((v) => v.status !== "pending")
        .map((v) => ({
          version: v.version,
          language: v.language,
          manifest_hash: formatHash(v.manifestHash),
          capabilities: v.capabilities,
          archive_size_bytes: v.archiveSizeBytes ?? 0,
          published_at:
            v.publishedAt instanceof Date ? v.publishedAt.toISOString() : null,
          yanked: v.status === "yanked",
          yanked_reason: v.yankedReason ?? null,
        })),
    };
  },
});
