import type { Types } from "mongoose";
import { Role } from "@/lib/db/models/role";
import { SYSTEM_ORG_ROLES } from "./permissions";

let seeded = false;

/**
 * Insert the three system roles (owner/admin/member) if they don't exist.
 * Idempotent — safe to call from any handler that needs a system role.
 * The system roles have `orgId: null` and are shared across every org.
 */
export async function ensureSystemRoles(): Promise<void> {
  if (seeded) return;
  await Promise.all(
    SYSTEM_ORG_ROLES.map((spec) =>
      Role.updateOne(
        { orgId: null, key: spec.key },
        {
          $set: {
            name: spec.name,
            description: spec.description,
            permissions: spec.permissions,
            isSystem: true,
          },
          $setOnInsert: { orgId: null, key: spec.key },
        },
        { upsert: true },
      ),
    ),
  );
  seeded = true;
}

export async function systemRoleByKey(
  key: string,
): Promise<{ _id: Types.ObjectId } | null> {
  await ensureSystemRoles();
  const doc = await Role.findOne({ orgId: null, key, isSystem: true })
    .select({ _id: 1 })
    .lean();
  if (!doc) return null;
  return { _id: doc._id as Types.ObjectId };
}
