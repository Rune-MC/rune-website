import { z } from "zod";
import { Errors, ok, route } from "@/lib/api";
import { connectDb, isDbConfigured } from "@/lib/db";
import { AuditLog } from "@/lib/db/models/audit-log";
import { Org } from "@/lib/db/models/org";
import { OrgMember } from "@/lib/db/models/org-member";
import { notify } from "@/lib/notifications/service";
import { ORG_PERMISSIONS } from "@/lib/rbac/permissions";
import { requirePermission } from "@/lib/rbac/resolver";
import { systemRoleByKey } from "@/lib/rbac/seed";

const params = z.object({ name: z.string() });
const body = z.object({ userId: z.string() });

export const POST = route({
  auth: "session",
  params,
  body,
  handler: async ({ params, body, auth }) => {
    if (!isDbConfigured()) throw new Errors.ServiceUnavailable();
    await connectDb();
    const org = await Org.findOne({ name: params.name.toLowerCase() });
    if (!org) throw new Errors.NotFound("Org not found");
    await requirePermission(auth.user, ORG_PERMISSIONS.OWNERSHIP_TRANSFER, {
      orgId: org._id,
    });

    if (String(org.ownerId) === body.userId) {
      throw new Errors.BadRequest("Already the owner");
    }

    const target = await OrgMember.findOne({
      orgId: org._id,
      userId: body.userId,
    });
    if (!target) {
      throw new Errors.BadRequest("Target user is not a member of the org");
    }

    const ownerRole = await systemRoleByKey("owner");
    const adminRole = await systemRoleByKey("admin");
    if (!ownerRole || !adminRole) {
      throw new Errors.Internal("System roles missing");
    }

    const previousOwnerId = org.ownerId;
    org.ownerId = target.userId;
    await org.save();

    // Promote target to Owner, demote previous owner to Admin.
    await OrgMember.updateOne(
      { orgId: org._id, userId: target.userId },
      { $set: { roleId: ownerRole._id } },
    );
    await OrgMember.updateOne(
      { orgId: org._id, userId: previousOwnerId },
      { $set: { roleId: adminRole._id } },
    );

    void notify({
      userId: target.userId,
      type: "org.role.changed",
      title: `You are the new owner of ${org.displayName ?? org.name}`,
      body: `Ownership of @${org.name} was transferred to you.`,
      href: `/dashboard/orgs/${org.name}`,
      data: { orgId: String(org._id) },
    }).catch(() => {});

    void AuditLog.create({
      actorUserId: auth.user._id,
      orgId: org._id,
      action: "org.transferred",
      data: { from: String(previousOwnerId), to: String(target.userId) },
    }).catch(() => {});

    return ok({ owner_id: String(target.userId) });
  },
});
