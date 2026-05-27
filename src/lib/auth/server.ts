import { cache } from "react";
import { connectDb, isDbConfigured } from "@/lib/db";
import { User, type UserDoc } from "@/lib/db/models/user";
import { readSession } from "./session";

export interface CurrentUser {
  doc: UserDoc;
}

/**
 * Resolves the signed-in user from the JWT session cookie. Returns `null`
 * when there's no valid session or the DB isn't configured. Cached per
 * request — calling it repeatedly inside one request hits the DB once.
 */
export const currentUser = cache(async (): Promise<CurrentUser | null> => {
  const claims = await readSession();
  if (!claims) return null;
  if (!isDbConfigured()) return null;

  await connectDb();
  const doc = await User.findById(claims.sub);
  if (!doc) return null;
  return { doc };
});
