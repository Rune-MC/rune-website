import { z } from "zod";
import { Errors, ok, requireScope, route } from "@/lib/api";
import { connectDb, isDbConfigured } from "@/lib/db";
import { AuditLog } from "@/lib/db/models/audit-log";
import {
  RUNE_NAME_PATTERN,
  RUNE_VISIBILITIES,
  Rune,
} from "@/lib/db/models/rune";
import { canPublishVersion } from "@/lib/rune-ownership";

const params = z.object({
  name: z.string().regex(RUNE_NAME_PATTERN),
});

const body = z.object({
  visibility: z.enum(RUNE_VISIBILITIES),
});

/**
 * Toggle a Rune's visibility. Requires the same authorization as publishing
 * a new version (owner / maintainer / org member with publish permission).
 * Changes are instantaneous: listings, search, and the public detail page
 * react on the next read.
 */
export const PATCH = route({
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

    const authz = await canPublishVersion(auth.user, rune);
    if (!authz.canPublish) {
      throw new Errors.Forbidden(authz.reason ?? "Not allowed");
    }

    if (rune.visibility === body.visibility) {
      return ok({ visibility: rune.visibility, unchanged: true });
    }

    const previous = rune.visibility;
    rune.visibility = body.visibility;
    await rune.save();

    void AuditLog.create({
      actorUserId: auth.user._id,
      action: "rune.visibility_changed",
      data: {
        name: rune.name,
        from: previous,
        to: rune.visibility,
      },
    }).catch(() => {});

    return ok({ visibility: rune.visibility });
  },
});
