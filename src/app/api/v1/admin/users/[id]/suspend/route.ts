import { z } from "zod";
import { Errors, ok, route } from "@/lib/api";
import { connectDb, isDbConfigured } from "@/lib/db";
import { AuditLog } from "@/lib/db/models/audit-log";
import { User } from "@/lib/db/models/user";
import { notify } from "@/lib/notifications/service";
import { PLATFORM_PERMISSIONS } from "@/lib/rbac/permissions";
import { requirePermission } from "@/lib/rbac/resolver";

const params = z.object({ id: z.string() });
const body = z.object({
  suspend: z.boolean(),
  reason: z.string().max(280).optional(),
});

export const POST = route({
  auth: "session",
  params,
  body,
  handler: async ({ params, body, auth }) => {
    if (!isDbConfigured()) throw new Errors.ServiceUnavailable();
    await requirePermission(auth.user, PLATFORM_PERMISSIONS.USERS_SUSPEND);
    await connectDb();

    const user = await User.findById(params.id);
    if (!user) throw new Errors.NotFound("User not found");

    if (body.suspend) {
      user.suspendedAt = new Date();
      user.suspendedReason = body.reason;
    } else {
      user.suspendedAt = undefined;
      user.suspendedReason = undefined;
    }
    await user.save();

    if (body.suspend) {
      void notify({
        userId: user._id,
        type: "platform.warning",
        title: "Your account was suspended",
        body: body.reason ?? "Contact support for details.",
        email: true,
      }).catch(() => {});
    }

    void AuditLog.create({
      actorUserId: auth.user._id,
      action: body.suspend ? "user.suspended" : "user.unsuspended",
      data: { targetUserId: params.id, reason: body.reason },
    }).catch(() => {});

    return ok({ suspended: body.suspend });
  },
});
