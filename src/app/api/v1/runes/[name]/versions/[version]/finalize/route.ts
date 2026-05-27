import { z } from "zod";
import { Errors, requireScope, route } from "@/lib/api";
import { connectDb, isDbConfigured } from "@/lib/db";
import { RUNE_NAME_PATTERN, Rune } from "@/lib/db/models/rune";
import { RuneVersion } from "@/lib/db/models/rune-version";
import { formatHash, hashHex } from "@/lib/manifest";
import { isR2Configured } from "@/lib/r2";
import { blobKey } from "@/lib/r2/keys";
import { blobExists } from "@/lib/r2/signed-urls";
import { canPublishVersion } from "@/lib/rune-ownership";
import { isNewer } from "@/lib/semver";

const params = z.object({
  name: z.string().regex(RUNE_NAME_PATTERN),
  version: z.string().min(1),
});

/**
 * Activate a pending version. Verifies that every blob the manifest references
 * is now in R2; rejects if any are missing. On success: marks active, updates
 * the Rune's `latestVersion` if this is the newest non-yanked version.
 */
export const POST = route({
  auth: "any",
  params,
  handler: async ({ params, auth }) => {
    if (!isDbConfigured())
      throw new Errors.ServiceUnavailable("Database not configured");
    if (!isR2Configured())
      throw new Errors.ServiceUnavailable("Storage not configured");
    requireScope(auth, "publish");

    await connectDb();

    const rune = await Rune.findOne({ name: params.name });
    if (!rune) throw new Errors.NotFound("Rune not found");

    const authz = await canPublishVersion(auth.user, rune);
    if (!authz.canPublish) {
      throw new Errors.Forbidden(authz.reason ?? "Cannot finalize");
    }

    const version = await RuneVersion.findOne({
      runeId: rune._id,
      version: params.version,
    });
    if (!version) throw new Errors.NotFound("Version not found");
    if (version.status === "active") {
      throw new Errors.Conflict("Version already finalized");
    }
    if (version.status === "yanked") {
      throw new Errors.Conflict("Version is yanked");
    }

    // Verify every referenced blob is in R2.
    const hexes = version.blobHashes.map((b) => hashHex(b));
    const checks = await Promise.all(
      hexes.map(async (hex) => ({
        hex,
        exists: await blobExists(blobKey(hex)),
      })),
    );
    const missing = checks
      .filter((c) => !c.exists)
      .map((c) => `sha256:${c.hex}`);
    if (missing.length > 0) {
      throw new Errors.BadRequest(
        `Cannot finalize: ${missing.length} blob(s) missing from R2`,
        { missing },
      );
    }

    version.status = "active";
    version.publishedAt = new Date();
    await version.save();

    if (isNewer(version.version, rune.latestVersion)) {
      rune.latestVersion = version.version;
      rune.latestVersionId = version._id;
      await rune.save();
    }

    return {
      name: rune.name,
      version: version.version,
      manifest_hash: formatHash(version.manifestHash),
      install: `rune add ${rune.name}@${version.version}`,
    };
  },
});
