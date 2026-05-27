import { z } from "zod";
import { Errors, ok, route } from "@/lib/api";
import { connectDb, isDbConfigured } from "@/lib/db";
import { AuditLog } from "@/lib/db/models/audit-log";
import { Org } from "@/lib/db/models/org";
import { OrgMember } from "@/lib/db/models/org-member";
import { Role } from "@/lib/db/models/role";
import { notify } from "@/lib/notifications/service";
import { ORG_PERMISSIONS } from "@/lib/rbac/permissions";
import { requirePermission } from "@/lib/rbac/resolver";

const params = z.object({ name: z.string(), userId: z.string() });

const patchBody = z.object({
  roleKey: z.string().min(1).max(48),
});

export const PATCH = route({
  auth: "session",
  params,
  body: patchBody,
  handler: async ({ params, body, auth }) => {
    if (!isDbConfigured()) throw new Errors.ServiceUnavailable();
    await connectDb();
    const org = await Org.findOne({ name: params.name.toLowerCase() });
    if (!org) throw new Errors.NotFound("Org not found");
    await requirePermission(auth.user, ORG_PERMISSIONS.MEMBERS_ROLE, {
      orgId: org._id,
    });

    if (String(org.ownerId) === params.userId) {
      throw new Errors.Conflict(
        "Cannot change the owner's role. Transfer ownership first.",
      );
    }

    const role = await Role.findOne({
      key: body.roleKey,
      $or: [{ orgId: null, isSystem: true }, { orgId: org._id }],
    });
    if (!role) throw new Errors.BadRequest(`Unknown role: ${body.roleKey}`);

    const member = await OrgMember.findOneAndUpdate(
      { orgId: org._id, userId: params.userId },
      { $set: { roleId: role._id } },
      { returnDocument: "after" },
    );
    if (!member) throw new Errors.NotFound("Member not found");

    void notify({
      userId: params.userId,
      type: "org.role.changed",
      title: `Your role in ${org.displayName ?? org.name} changed`,
      body: `You are now a ${role.name}.`,
      href: `/dashboard/orgs/${org.name}`,
      data: { orgId: String(org._id), roleKey: role.key },
    }).catch(() => {});

    void AuditLog.create({
      actorUserId: auth.user._id,
      orgId: org._id,
      action: "org.member.role_changed",
      data: { targetUserId: params.userId, roleKey: role.key },
    }).catch(() => {});

    return ok({ user_id: params.userId, role_key: role.key });
  },
});

export const DELETE = route({
  auth: "session",
  params,
  handler: async ({ params, auth }) => {
    if (!isDbConfigured()) throw new Errors.ServiceUnavailable();
    await connectDb();
    const org = await Org.findOne({ name: params.name.toLowerCase() });
    if (!org) throw new Errors.NotFound("Org not found");

    const isSelf = String(auth.user._id) === params.userId;
    if (!isSelf) {
      await requirePermission(auth.user, ORG_PERMISSIONS.MEMBERS_REMOVE, {
        orgId: org._id,
      });
    }

    if (String(org.ownerId) === params.userId) {
      throw new Errors.Conflict(
        "Cannot remove the owner. Transfer ownership first.",
      );
    }

    const res = await OrgMember.deleteOne({
      orgId: org._id,
      userId: params.userId,
    });
    if (res.deletedCount === 0) {
      throw new Errors.NotFound("Member not found");
    }

    if (!isSelf) {
      void notify({
        userId: params.userId,
        type: "org.member.removed",
        title: `Removed from ${org.displayName ?? org.name}`,
        body: `You are no longer a member of @${org.name}.`,
        data: { orgName: org.name },
      }).catch(() => {});
    }

    void AuditLog.create({
      actorUserId: auth.user._id,
      orgId: org._id,
      action: isSelf ? "org.member.left" : "org.member.removed",
      data: { targetUserId: params.userId },
    }).catch(() => {});

    return ok({ removed: true });
  },
});
