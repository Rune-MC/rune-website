import { created, Errors, ok, requireScope, route } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { AuditLog } from "@/lib/db/models/audit-log";
import { Org } from "@/lib/db/models/org";
import { OrgMember } from "@/lib/db/models/org-member";
import { User } from "@/lib/db/models/user";
import { PLATFORM_PERMISSIONS } from "@/lib/rbac/permissions";
import { requirePermission } from "@/lib/rbac/resolver";
import { systemRoleByKey } from "@/lib/rbac/seed";

/** Bootstrap the reserved official publishing scope without opening public registration. */
export const POST = route({
  auth: "cli",
  handler: async ({ auth }) => {
    requireScope(auth, "publish");
    await requirePermission(auth.user, PLATFORM_PERMISSIONS.OFFICIAL_SCOPE_PROVISION);
    if (await User.exists({ username: "rune" })) {
      throw new Errors.Conflict("@rune is already owned by a user.");
    }
    const db = await connectDb();
    const role = await systemRoleByKey("owner");
    if (!role) throw new Errors.Internal("The organization owner role is unavailable.");

    return db.connection.transaction(async (session) => {
      const existing = await Org.findOne({ name: "rune" }).session(session);
      if (existing) {
        if (!existing.ownerId.equals(auth.user._id)) {
          throw new Errors.Conflict("@rune already has an owner.");
        }
        return ok({ name: existing.name });
      }
      const org = new Org({
        name: "rune",
        displayName: "Rune",
        description: "Official Rune libraries and utilities for Paper servers.",
        homepage: "https://runemc.dev",
        ownerId: auth.user._id,
      });
      await org.save({ session });
      await new OrgMember({
        orgId: org._id,
        userId: auth.user._id,
        roleId: role._id,
      }).save({ session });
      await new AuditLog({
        actorUserId: auth.user._id,
        orgId: org._id,
        action: "org.official-scope-provisioned",
      }).save({ session });
      return created({ name: org.name });
    });
  },
});
