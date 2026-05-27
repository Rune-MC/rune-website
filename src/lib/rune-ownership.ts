import type { Types } from "mongoose";
import { Org } from "@/lib/db/models/org";
import type { RuneDoc } from "@/lib/db/models/rune";
import { User, type UserDoc } from "@/lib/db/models/user";
import { ORG_PERMISSIONS } from "@/lib/rbac/permissions";
import { can } from "@/lib/rbac/resolver";

/**
 * Resolve a `@scope/name` Rune to a prospective owner — either a user
 * (matching `username`) or an org (matching `name`). Returns null for
 * unscoped Runes; the caller treats those as user-owned by the publisher.
 */
export async function resolveScopeOwner(
  scope: string,
): Promise<
  | { kind: "user"; id: Types.ObjectId }
  | { kind: "org"; id: Types.ObjectId }
  | null
> {
  const lower = scope.toLowerCase();
  const [user, org] = await Promise.all([
    User.findOne({ username: lower }).select({ _id: 1 }).lean(),
    Org.findOne({ name: lower }).select({ _id: 1 }).lean(),
  ]);
  if (user) return { kind: "user", id: user._id };
  if (org) return { kind: "org", id: org._id };
  return null;
}

export interface PublishAuthz {
  canPublish: boolean;
  /** True if the publisher is the *new* version's `publishedBy` reference. */
  publisherOk: boolean;
  /** Why publishing is or isn't allowed (for error messages). */
  reason?: string;
}

/**
 * Check whether `user` may publish a new version of `rune` (which already
 * exists). For user-owned Runes, `user` must be the owner or a maintainer.
 * For org-owned Runes, `user` must hold `org.package.publish` on that org.
 */
export async function canPublishVersion(
  user: UserDoc,
  rune: RuneDoc,
): Promise<PublishAuthz> {
  if (rune.ownerKind === "user") {
    const isOwner = String(rune.ownerId) === String(user._id);
    const isMaintainer = rune.maintainerIds.some(
      (id) => String(id) === String(user._id),
    );
    if (!isOwner && !isMaintainer) {
      return {
        canPublish: false,
        publisherOk: false,
        reason: "Not an owner or maintainer of this Rune",
      };
    }
    return { canPublish: true, publisherOk: true };
  }

  // org-owned
  const allowed = await can(user, ORG_PERMISSIONS.PACKAGE_PUBLISH, {
    orgId: rune.ownerId,
  });
  if (!allowed) {
    return {
      canPublish: false,
      publisherOk: false,
      reason: "Missing publish permission for this org",
    };
  }
  return { canPublish: true, publisherOk: true };
}

/** Check yank rights. Owners + maintainers + org members with the perm. */
export async function canYankVersion(
  user: UserDoc,
  rune: RuneDoc,
  publishedByUserId: Types.ObjectId | string,
): Promise<boolean> {
  if (rune.ownerKind === "user") {
    if (String(rune.ownerId) === String(user._id)) return true;
    if (rune.maintainerIds.some((id) => String(id) === String(user._id))) {
      return true;
    }
    return false;
  }
  // Org-owned: yank.any covers all, yank.own when publisher matches.
  const anyOk = await can(user, ORG_PERMISSIONS.PACKAGE_YANK_ANY, {
    orgId: rune.ownerId,
  });
  if (anyOk) return true;
  if (String(publishedByUserId) === String(user._id)) {
    return can(user, ORG_PERMISSIONS.PACKAGE_YANK_OWN, {
      orgId: rune.ownerId,
    });
  }
  return false;
}
