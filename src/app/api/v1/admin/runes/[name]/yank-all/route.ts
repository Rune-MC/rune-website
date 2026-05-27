import { z } from "zod";
import { Errors, ok, route } from "@/lib/api";
import { connectDb, isDbConfigured } from "@/lib/db";
import { AuditLog } from "@/lib/db/models/audit-log";
import { Rune } from "@/lib/db/models/rune";
import { RuneVersion } from "@/lib/db/models/rune-version";
import { PLATFORM_PERMISSIONS } from "@/lib/rbac/permissions";
import { requirePermission } from "@/lib/rbac/resolver";

const params = z.object({ name: z.string() });
const body = z.object({ reason: z.string().min(1).max(280) });

/**
 * Platform-mass yank: marks every active version yanked with a platform-set
 * reason. Existing pinned installs still work; default resolver hides them.
 */
export const POST = route({
  auth: "session",
  params,
  body,
  handler: async ({ params, body, auth }) => {
    if (!isDbConfigured()) throw new Errors.ServiceUnavailable();
    await requirePermission(auth.user, PLATFORM_PERMISSIONS.RUNES_YANK);
    await connectDb();

    const rune = await Rune.findOne({ name: params.name.toLowerCase() });
    if (!rune) throw new Errors.NotFound("Rune not found");

    const res = await RuneVersion.updateMany(
      { runeId: rune._id, status: "active" },
      {
        $set: {
          status: "yanked",
          yankedAt: new Date(),
          yankedReason: `[platform] ${body.reason}`,
        },
      },
    );

    rune.latestVersion = undefined;
    rune.latestVersionId = undefined;
    await rune.save();

    void AuditLog.create({
      actorUserId: auth.user._id,
      action: "platform.rune.yanked_all",
      data: {
        name: rune.name,
        reason: body.reason,
        versionsYanked: res.modifiedCount,
      },
    }).catch(() => {});

    return ok({ yanked: res.modifiedCount });
  },
});
