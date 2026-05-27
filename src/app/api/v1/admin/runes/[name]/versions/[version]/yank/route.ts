import { z } from "zod";
import { Errors, ok, route } from "@/lib/api";
import { connectDb, isDbConfigured } from "@/lib/db";
import { AuditLog } from "@/lib/db/models/audit-log";
import { Rune } from "@/lib/db/models/rune";
import { RuneVersion } from "@/lib/db/models/rune-version";
import { PLATFORM_PERMISSIONS } from "@/lib/rbac/permissions";
import { requirePermission } from "@/lib/rbac/resolver";

const params = z.object({
  name: z.string(),
  version: z.string().min(1),
});
const body = z.object({ reason: z.string().min(1).max(280) });

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

    const version = await RuneVersion.findOne({
      runeId: rune._id,
      version: params.version,
    });
    if (!version) throw new Errors.NotFound("Version not found");
    if (version.status === "yanked") {
      throw new Errors.Conflict("Already yanked");
    }
    if (version.status === "pending") {
      throw new Errors.Conflict("Pending version cannot be yanked");
    }

    version.status = "yanked";
    version.yankedAt = new Date();
    version.yankedReason = `[platform] ${body.reason}`;
    await version.save();

    // If this was the latest, fall back to newest active.
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

    void AuditLog.create({
      actorUserId: auth.user._id,
      action: "platform.rune_version.yanked",
      data: {
        name: rune.name,
        version: version.version,
        reason: body.reason,
      },
    }).catch(() => {});

    return ok({ yanked: true });
  },
});
