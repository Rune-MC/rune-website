import { z } from "zod";
import { Errors, ok, route } from "@/lib/api";
import { connectDb, isDbConfigured } from "@/lib/db";
import { AuditLog } from "@/lib/db/models/audit-log";
import { Org } from "@/lib/db/models/org";
import { OrgMember } from "@/lib/db/models/org-member";
import { Role } from "@/lib/db/models/role";
import { ORG_PERMISSIONS } from "@/lib/rbac/permissions";
import { requirePermission } from "@/lib/rbac/resolver";

const params = z.object({ name: z.string(), roleId: z.string() });

const patchBody = z.object({
  name: z.string().trim().min(1).max(48).optional(),
  description: z.string().trim().max(240).optional(),
  permissions: z.array(z.string()).optional(),
});

async function loadRole(orgName: string, roleId: string) {
  const org = await Org.findOne({ name: orgName.toLowerCase() });
  if (!org) throw new Errors.NotFound("Org not found");
  const role = await Role.findById(roleId);
  if (!role || (role.orgId && String(role.orgId) !== String(org._id))) {
    throw new Errors.NotFound("Role not found");
  }
  return { org, role };
}

export const PATCH = route({
  auth: "session",
  params,
  body: patchBody,
  handler: async ({ params, body, auth }) => {
    if (!isDbConfigured()) throw new Errors.ServiceUnavailable();
    await connectDb();
    const { org, role } = await loadRole(params.name, params.roleId);
    await requirePermission(auth.user, ORG_PERMISSIONS.ROLES_WRITE, {
      orgId: org._id,
    });
    if (role.isSystem) {
      throw new Errors.Forbidden("System roles cannot be edited");
    }

    if (body.name !== undefined) role.name = body.name;
    if (body.description !== undefined) role.description = body.description;
    if (body.permissions !== undefined) {
      const valid = new Set<string>(Object.values(ORG_PERMISSIONS));
      role.permissions = body.permissions.filter((p) => valid.has(p));
    }
    await role.save();

    void AuditLog.create({
      actorUserId: auth.user._id,
      orgId: org._id,
      action: "org.role.updated",
      data: { roleId: String(role._id), key: role.key },
    }).catch(() => {});

    return ok({ id: String(role._id), key: role.key });
  },
});

export const DELETE = route({
  auth: "session",
  params,
  handler: async ({ params, auth }) => {
    if (!isDbConfigured()) throw new Errors.ServiceUnavailable();
    await connectDb();
    const { org, role } = await loadRole(params.name, params.roleId);
    await requirePermission(auth.user, ORG_PERMISSIONS.ROLES_WRITE, {
      orgId: org._id,
    });
    if (role.isSystem) {
      throw new Errors.Forbidden("System roles cannot be deleted");
    }

    const inUse = await OrgMember.exists({ orgId: org._id, roleId: role._id });
    if (inUse) {
      throw new Errors.Conflict(
        "Role is assigned to one or more members. Re-assign them first.",
      );
    }

    await role.deleteOne();
    void AuditLog.create({
      actorUserId: auth.user._id,
      orgId: org._id,
      action: "org.role.deleted",
      data: { key: role.key },
    }).catch(() => {});

    return ok({ deleted: true });
  },
});
