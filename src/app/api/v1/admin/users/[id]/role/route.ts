import { z } from "zod";
import { Errors, ok, route } from "@/lib/api";
import { connectDb, isDbConfigured } from "@/lib/db";
import { AuditLog } from "@/lib/db/models/audit-log";
import { PLATFORM_ROLES, User } from "@/lib/db/models/user";
import { PLATFORM_PERMISSIONS } from "@/lib/rbac/permissions";
import { requirePermission } from "@/lib/rbac/resolver";

const params = z.object({ id: z.string() });
const body = z.object({
  role: z.enum(PLATFORM_ROLES).nullable(),
});

export const POST = route({
  auth: "session",
  params,
  body,
  handler: async ({ params, body, auth }) => {
    if (!isDbConfigured()) throw new Errors.ServiceUnavailable();
    // Only platform owners can mint other platform roles.
    await requirePermission(auth.user, PLATFORM_PERMISSIONS.USERS_ROLE);
    await connectDb();

    const user = await User.findById(params.id);
    if (!user) throw new Errors.NotFound("User not found");

    user.platformRole = body.role ?? undefined;
    await user.save();

    void AuditLog.create({
      actorUserId: auth.user._id,
      action: "user.platform_role_set",
      data: { targetUserId: params.id, role: body.role },
    }).catch(() => {});

    return ok({ role: user.platformRole ?? null });
  },
});
