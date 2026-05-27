import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { z } from "zod";
import { Errors, ok, route } from "@/lib/api";
import { connectDb, isDbConfigured } from "@/lib/db";
import { AuditLog } from "@/lib/db/models/audit-log";
import { Rune } from "@/lib/db/models/rune";
import { RuneVersion } from "@/lib/db/models/rune-version";
import { hashHex } from "@/lib/manifest";
import { isR2Configured, r2Bucket, r2Client } from "@/lib/r2";
import { manifestKey } from "@/lib/r2/keys";
import { PLATFORM_PERMISSIONS } from "@/lib/rbac/permissions";
import { requirePermission } from "@/lib/rbac/resolver";

const params = z.object({ name: z.string() });

/**
 * Platform-only hard delete. Removes the Rune, every version, and best-effort
 * deletes the manifest objects from R2. Blob objects are intentionally left
 * in place — they're content-addressed and may be referenced by other Runes.
 * A separate GC sweep reclaims orphans.
 */
export const DELETE = route({
  auth: "session",
  params,
  handler: async ({ params, auth }) => {
    if (!isDbConfigured()) throw new Errors.ServiceUnavailable();
    await requirePermission(auth.user, PLATFORM_PERMISSIONS.RUNES_DELETE);
    await connectDb();

    const rune = await Rune.findOne({ name: params.name.toLowerCase() });
    if (!rune) throw new Errors.NotFound("Rune not found");

    const versions = await RuneVersion.find({ runeId: rune._id });

    // Best-effort R2 cleanup of manifest objects. Blob objects are shared.
    if (isR2Configured()) {
      const manifestHexes = versions.map((v) => hashHex(v.manifestHash));
      await Promise.all(
        manifestHexes.map((hex) =>
          r2Client()
            .send(
              new DeleteObjectCommand({
                Bucket: r2Bucket(),
                Key: manifestKey(hex),
              }),
            )
            .catch(() => {
              /* swallow — orphan manifest is harmless */
            }),
        ),
      );
    }

    const versionCount = versions.length;
    await RuneVersion.deleteMany({ runeId: rune._id });
    await rune.deleteOne();

    void AuditLog.create({
      actorUserId: auth.user._id,
      action: "platform.rune.deleted",
      data: { name: rune.name, versionCount },
    }).catch(() => {});

    return ok({ deleted: true, versions_removed: versionCount });
  },
});
