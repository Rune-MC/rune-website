import { z } from "zod";
import { Errors, requireScope, route } from "@/lib/api";
import { connectDb, isDbConfigured } from "@/lib/db";
import { RUNE_NAME_PATTERN, Rune } from "@/lib/db/models/rune";
import { RuneVersion } from "@/lib/db/models/rune-version";

const params = z.object({
  name: z.string().regex(RUNE_NAME_PATTERN),
  version: z.string().min(1),
});

const body = z.object({
  reason: z.string().min(1).max(280),
});

/**
 * Soft-delete a published version. Blobs + manifest remain accessible
 * (anyone who pinned this version can still install it); the version
 * disappears from the default resolver and shows a warning banner.
 */
export const POST = route({
  auth: "any",
  params,
  body,
  handler: async ({ params, body, auth }) => {
    if (!isDbConfigured()) {
      throw new Errors.ServiceUnavailable("Database not configured");
    }
    requireScope(auth, "publish");

    await connectDb();

    const rune = await Rune.findOne({ name: params.name });
    if (!rune) throw new Errors.NotFound("Rune not found");

    const isOwner = rune.owners.some(
      (o) => String(o.userId) === String(auth.user._id),
    );
    if (!isOwner) throw new Errors.Forbidden();

    const version = await RuneVersion.findOne({
      runeId: rune._id,
      version: params.version,
    });
    if (!version) throw new Errors.NotFound("Version not found");
    if (version.status === "yanked") {
      throw new Errors.Conflict("Version already yanked");
    }
    if (version.status === "pending") {
      throw new Errors.Conflict(
        "Pending version cannot be yanked; finalize or wait for GC",
      );
    }

    version.status = "yanked";
    version.yankedAt = new Date();
    version.yankedReason = body.reason;
    await version.save();

    // If this was the latest, fall back to the newest still-active version.
    if (
      rune.latestVersionId &&
      String(rune.latestVersionId) === String(version._id)
    ) {
      const next = await RuneVersion.findOne({
        runeId: rune._id,
        status: "active",
      })
        .sort({ publishedAt: -1 })
        .lean();
      rune.latestVersion = next?.version ?? undefined;
      rune.latestVersionId = next?._id ?? undefined;
      await rune.save();
    }

    return {
      name: rune.name,
      version: version.version,
      yanked: true,
      reason: body.reason,
    };
  },
});
