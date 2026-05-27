import { Org } from "@/lib/db/models/org";
import { User } from "@/lib/db/models/user";

export const SCOPE_PATTERN = /^[a-z0-9-]+$/;

/**
 * Whether `name` is already claimed as a username OR an org name. Usernames
 * and org names share a single namespace; first to claim wins.
 */
export async function isScopeTaken(name: string): Promise<boolean> {
  const lower = name.toLowerCase();
  const [u, o] = await Promise.all([
    User.exists({ username: lower }),
    Org.exists({ name: lower }),
  ]);
  return Boolean(u || o);
}

export function isReservedScope(name: string): boolean {
  return RESERVED.has(name.toLowerCase());
}

/**
 * Names we never let anyone claim. Mostly to avoid URL collisions with the
 * site's own routes and the obvious abuse vectors.
 */
const RESERVED = new Set([
  "admin",
  "administrator",
  "api",
  "auth",
  "billing",
  "blog",
  "dashboard",
  "docs",
  "help",
  "invitations",
  "login",
  "logout",
  "official",
  "rune",
  "runebook",
  "runemc",
  "settings",
  "signup",
  "staff",
  "support",
  "system",
  "team",
  "www",
]);
