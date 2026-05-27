import { z } from "zod";
import { created, Errors, ok, route } from "@/lib/api";
import { connectDb, isDbConfigured } from "@/lib/db";
import { AuditLog } from "@/lib/db/models/audit-log";
import { Org } from "@/lib/db/models/org";
import { Role } from "@/lib/db/models/role";
import { ORG_PERMISSIONS, type OrgPermission } from "@/lib/rbac/permissions";
import { requirePermission } from "@/lib/rbac/resolver";
import { ensureSystemRoles } from "@/lib/rbac/seed";

const params = z.object({ name: z.string() });

const createBody = z.object({
  key: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(48)
    .regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(1).max(48),
  description: z.string().trim().max(240).optional(),
  permissions: z.array(z.string()).default([]),
});

export const GET = route({
  auth: "session",
  params,
  handler: async ({ params, auth }) => {
    if (!isDbConfigured()) throw new Errors.ServiceUnavailable();
    await connectDb();
    await ensureSystemRoles();
    const org = await Org.findOne({ name: params.name.toLowerCase() });
    if (!org) throw new Errors.NotFound("Org not found");
    await requirePermission(auth.user, ORG_PERMISSIONS.ROLES_READ, {
      orgId: org._id,
    });

    const roles = await Role.find({
      $or: [{ orgId: null, isSystem: true }, { orgId: org._id }],
    }).lean();

    return ok({
      roles: roles.map((r) => ({
        id: String(r._id),
        key: r.key,
        name: r.name,
        description: r.description ?? null,
        permissions: r.permissions,
        is_system: r.isSystem,
      })),
    });
  },
});

export const POST = route({
  auth: "session",
  params,
  body: createBody,
  handler: async ({ params, body, auth }) => {
    if (!isDbConfigured()) throw new Errors.ServiceUnavailable();
    await connectDb();
    const org = await Org.findOne({ name: params.name.toLowerCase() });
    if (!org) throw new Errors.NotFound("Org not found");
    await requirePermission(auth.user, ORG_PERMISSIONS.ROLES_WRITE, {
      orgId: org._id,
    });

    // Custom roles can only grant org permissions, never platform ones.
    const validPerms = new Set<string>(Object.values(ORG_PERMISSIONS));
    const filteredPerms = body.permissions.filter((p) =>
      validPerms.has(p),
    ) as OrgPermission[];

    const conflict = await Role.findOne({ orgId: org._id, key: body.key });
    if (conflict) {
      throw new Errors.Conflict(`Role "${body.key}" already exists`);
    }

    const role = await Role.create({
      orgId: org._id,
      key: body.key,
      name: body.name,
      description: body.description,
      permissions: filteredPerms,
      isSystem: false,
    });

    void AuditLog.create({
      actorUserId: auth.user._id,
      orgId: org._id,
      action: "org.role.created",
      data: { key: role.key, permissions: filteredPerms },
    }).catch(() => {});

    return created({
      id: String(role._id),
      key: role.key,
      name: role.name,
      permissions: role.permissions,
    });
  },
});
