import type { Types } from "mongoose";
import { Errors } from "@/lib/api/errors";
import { Org, type OrgDoc } from "@/lib/db/models/org";
import { OrgMember } from "@/lib/db/models/org-member";
import { Role } from "@/lib/db/models/role";
import type { UserDoc } from "@/lib/db/models/user";
import {
  isOrgPermission,
  isPlatformPermission,
  type OrgPermission,
  type Permission,
  PLATFORM_ROLE_PERMS,
  type PlatformPermission,
} from "./permissions";

export interface OrgContext {
  orgId: string | Types.ObjectId;
}

/**
 * The canonical permission check. Use everywhere instead of inline role
 * comparisons. Platform owners/admins bypass org checks entirely.
 */
export async function can(
  user: UserDoc | null,
  permission: Permission,
  ctx?: OrgContext,
): Promise<boolean> {
  if (!user) return false;
  if (user.suspendedAt) return false;

  // Platform staff: a permission held by their platform role applies.
  if (user.platformRole) {
    const platformPerms = PLATFORM_ROLE_PERMS[user.platformRole];
    if (platformPerms.includes(permission as PlatformPermission)) return true;
    // Platform owners bypass org-level checks (admin access path).
    if (user.platformRole === "owner" && isOrgPermission(permission)) {
      return true;
    }
  }

  if (isPlatformPermission(permission)) {
    // Only handled by the platform-role branch above.
    return false;
  }

  if (isOrgPermission(permission)) {
    if (!ctx) return false;
    return checkOrgPermission(user, permission, ctx.orgId);
  }

  return false;
}

async function checkOrgPermission(
  user: UserDoc,
  permission: OrgPermission,
  orgId: string | Types.ObjectId,
): Promise<boolean> {
  const membership = await OrgMember.findOne({
    orgId,
    userId: user._id,
  }).lean();
  if (!membership) return false;

  const role = await Role.findById(membership.roleId).lean();
  if (!role) return false;

  if (role.permissions.includes(permission)) return true;
  if (membership.extraPermissions?.includes(permission)) return true;
  return false;
}

/** Convenience: throw a 403-equivalent if the check fails. */
export async function requirePermission(
  user: UserDoc | null,
  permission: Permission,
  ctx?: OrgContext,
): Promise<void> {
  const allowed = await can(user, permission, ctx);
  if (!allowed) {
    throw new Errors.Forbidden(`Missing permission: ${permission}`);
  }
}

/** Return every org the user is a member of, including the owner role check. */
export async function userOrgs(user: UserDoc): Promise<
  Array<{
    org: OrgDoc;
    roleKey: string;
    isOwner: boolean;
  }>
> {
  const memberships = await OrgMember.find({ userId: user._id }).lean();
  if (memberships.length === 0) return [];

  const [orgs, roles] = await Promise.all([
    Org.find({ _id: { $in: memberships.map((m) => m.orgId) } }),
    Role.find({ _id: { $in: memberships.map((m) => m.roleId) } }).lean(),
  ]);
  const rolesById = new Map(roles.map((r) => [String(r._id), r]));
  const orgsById = new Map(orgs.map((o) => [String(o._id), o]));

  const out: Array<{ org: OrgDoc; roleKey: string; isOwner: boolean }> = [];
  for (const m of memberships) {
    const org = orgsById.get(String(m.orgId));
    const role = rolesById.get(String(m.roleId));
    if (!org || !role) continue;
    out.push({
      org,
      roleKey: role.key,
      isOwner: String(org.ownerId) === String(user._id),
    });
  }
  return out;
}
