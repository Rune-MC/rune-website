import { z } from "zod";
import { created, Errors, ok, route } from "@/lib/api";
import { connectDb, isDbConfigured } from "@/lib/db";
import { AuditLog } from "@/lib/db/models/audit-log";
import { Org } from "@/lib/db/models/org";
import { OrgMember } from "@/lib/db/models/org-member";
import { userOrgs } from "@/lib/rbac/resolver";
import { ensureSystemRoles, systemRoleByKey } from "@/lib/rbac/seed";
import { isReservedScope, isScopeTaken, SCOPE_PATTERN } from "@/lib/scope";

const createBody = z.object({
  name: z.string().trim().toLowerCase().min(3).max(32).regex(SCOPE_PATTERN),
  displayName: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(280).optional(),
});

export const GET = route({
  auth: "session",
  handler: async ({ auth }) => {
    if (!isDbConfigured()) throw new Errors.ServiceUnavailable();
    await connectDb();
    const orgs = await userOrgs(auth.user);
    return ok({
      orgs: orgs.map(({ org, roleKey, isOwner }) => ({
        id: String(org._id),
        name: org.name,
        display_name: org.displayName ?? org.name,
        description: org.description ?? null,
        avatar_url: org.avatarUrl ?? null,
        role: roleKey,
        is_owner: isOwner,
      })),
    });
  },
});

export const POST = route({
  auth: "session",
  body: createBody,
  handler: async ({ auth, body }) => {
    if (!isDbConfigured()) throw new Errors.ServiceUnavailable();
    await connectDb();

    if (isReservedScope(body.name)) {
      throw new Errors.Conflict(`@${body.name} is reserved`);
    }
    if (await isScopeTaken(body.name)) {
      throw new Errors.Conflict(`@${body.name} is taken`);
    }

    await ensureSystemRoles();
    const ownerRole = await systemRoleByKey("owner");
    if (!ownerRole) throw new Errors.Internal("System roles missing");

    const org = await Org.create({
      name: body.name,
      displayName: body.displayName ?? body.name,
      description: body.description,
      ownerId: auth.user._id,
    });

    await OrgMember.create({
      orgId: org._id,
      userId: auth.user._id,
      roleId: ownerRole._id,
      joinedAt: new Date(),
    });

    void AuditLog.create({
      actorUserId: auth.user._id,
      orgId: org._id,
      action: "org.created",
      data: { name: org.name },
    }).catch(() => {});

    return created({
      id: String(org._id),
      name: org.name,
      display_name: org.displayName ?? org.name,
    });
  },
});
