import { z } from "zod";
import { Errors, ok, route } from "@/lib/api";
import { connectDb, isDbConfigured } from "@/lib/db";
import { AuditLog } from "@/lib/db/models/audit-log";
import { Org } from "@/lib/db/models/org";
import { OrgMember } from "@/lib/db/models/org-member";
import { Rune } from "@/lib/db/models/rune";
import { ORG_PERMISSIONS } from "@/lib/rbac/permissions";
import { requirePermission } from "@/lib/rbac/resolver";

const params = z.object({ name: z.string() });

const patchBody = z.object({
  displayName: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(280).nullable().optional(),
  homepage: z.string().url().nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

async function resolveOrg(name: string) {
  const org = await Org.findOne({ name: name.toLowerCase() });
  if (!org) throw new Errors.NotFound("Org not found");
  return org;
}

export const GET = route({
  auth: "session",
  params,
  handler: async ({ params, auth }) => {
    if (!isDbConfigured()) throw new Errors.ServiceUnavailable();
    await connectDb();
    const org = await resolveOrg(params.name);
    await requirePermission(auth.user, ORG_PERMISSIONS.SETTINGS_READ, {
      orgId: org._id,
    });
    const memberCount = await OrgMember.countDocuments({ orgId: org._id });
    return ok({
      id: String(org._id),
      name: org.name,
      display_name: org.displayName ?? org.name,
      description: org.description ?? null,
      homepage: org.homepage ?? null,
      avatar_url: org.avatarUrl ?? null,
      owner_id: String(org.ownerId),
      member_count: memberCount,
      suspended: Boolean(org.suspendedAt),
      created_at:
        org.createdAt instanceof Date ? org.createdAt.toISOString() : null,
    });
  },
});

export const PATCH = route({
  auth: "session",
  params,
  body: patchBody,
  handler: async ({ params, body, auth }) => {
    if (!isDbConfigured()) throw new Errors.ServiceUnavailable();
    await connectDb();
    const org = await resolveOrg(params.name);
    await requirePermission(auth.user, ORG_PERMISSIONS.SETTINGS_WRITE, {
      orgId: org._id,
    });

    if (body.displayName !== undefined) org.displayName = body.displayName;
    if (body.description !== undefined)
      org.description = body.description ?? undefined;
    if (body.homepage !== undefined) org.homepage = body.homepage ?? undefined;
    if (body.avatarUrl !== undefined)
      org.avatarUrl = body.avatarUrl ?? undefined;

    await org.save();
    void AuditLog.create({
      actorUserId: auth.user._id,
      orgId: org._id,
      action: "org.updated",
      data: { fields: Object.keys(body) },
    }).catch(() => {});

    return ok({ id: String(org._id), name: org.name });
  },
});

export const DELETE = route({
  auth: "session",
  params,
  handler: async ({ params, auth }) => {
    if (!isDbConfigured()) throw new Errors.ServiceUnavailable();
    await connectDb();
    const org = await resolveOrg(params.name);
    await requirePermission(auth.user, ORG_PERMISSIONS.ORG_DELETE, {
      orgId: org._id,
    });

    // Block deletion if the org still owns any Runes — operator should
    // transfer or yank them first.
    const hasRunes = await Rune.exists({ ownerKind: "org", ownerId: org._id });
    if (hasRunes) {
      throw new Errors.Conflict(
        "Org still owns Runes. Transfer or delete them first.",
      );
    }

    await OrgMember.deleteMany({ orgId: org._id });
    await org.deleteOne();

    void AuditLog.create({
      actorUserId: auth.user._id,
      orgId: org._id,
      action: "org.deleted",
      data: { name: org.name },
    }).catch(() => {});

    return ok({ deleted: true });
  },
});
