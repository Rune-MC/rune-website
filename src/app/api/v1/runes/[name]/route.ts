import { z } from "zod";
import { Errors, route } from "@/lib/api";
import { connectDb, isDbConfigured } from "@/lib/db";
import { Org } from "@/lib/db/models/org";
import { RUNE_NAME_PATTERN, Rune } from "@/lib/db/models/rune";
import { RuneVersion } from "@/lib/db/models/rune-version";
import { User } from "@/lib/db/models/user";
import { formatHash } from "@/lib/manifest";
import { canReadRune } from "@/lib/rune-ownership";

const params = z.object({
  name: z.string().regex(RUNE_NAME_PATTERN),
});

export const GET = route({
  auth: "optional",
  params,
  handler: async ({ params, auth }) => {
    if (!isDbConfigured()) {
      throw new Errors.ServiceUnavailable("Database not configured");
    }
    await connectDb();

    const rune = await Rune.findOne({ name: params.name }).lean();
    if (!rune) throw new Errors.NotFound("Rune not found");

    const visible = await canReadRune(auth?.user ?? null, rune);
    if (!visible) throw new Errors.NotFound("Rune not found");

    const versions = await RuneVersion.find({ runeId: rune._id })
      .sort({ publishedAt: -1, createdAt: -1 })
      .lean();

    let owner: { kind: "user" | "org"; name: string | null } = {
      kind: rune.ownerKind,
      name: null,
    };
    if (rune.ownerKind === "user") {
      const u = await User.findById(rune.ownerId)
        .select({ username: 1, githubLogin: 1 })
        .lean();
      owner = { kind: "user", name: u?.username ?? u?.githubLogin ?? null };
    } else {
      const o = await Org.findById(rune.ownerId).select({ name: 1 }).lean();
      owner = { kind: "org", name: o?.name ?? null };
    }

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
      owner,
      visibility: rune.visibility ?? "public",
      is_library: rune.isLibrary === true,
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
