import { locksmithServerClientFromEnv } from "@getlocksmith/nextjs/server";
import { cookies } from "next/headers";
import { cache } from "react";
import { connectDb, isDbConfigured } from "@/lib/db";
import { User, type UserDoc } from "@/lib/db/models/user";

export type LocksmithUser = Awaited<
  ReturnType<ReturnType<typeof locksmithServerClientFromEnv>["getUser"]>
>;

export const currentLocksmithUser = cache(
  async (): Promise<LocksmithUser | null> => {
    if (!process.env.LOCKSMITH_API_KEY) return null;
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get("locksmith_at")?.value;
      if (!token) return null;
      const client = locksmithServerClientFromEnv();
      return await client.getUser(token);
    } catch {
      return null;
    }
  },
);

export type CurrentUser = {
  locksmith: LocksmithUser;
  doc: UserDoc;
};

/**
 * Resolves the Locksmith session AND upserts the bridged `users` doc.
 * Returns `null` when the user is signed out or when the DB isn't configured.
 * Cached per request — calling repeatedly inside one request is free.
 */
export const currentUser = cache(async (): Promise<CurrentUser | null> => {
  const locksmith = await currentLocksmithUser();
  if (!locksmith) return null;
  if (!isDbConfigured()) return null;

  await connectDb();
  const doc = await User.findOneAndUpdate(
    { locksmithSub: locksmith.id },
    { $setOnInsert: { locksmithSub: locksmith.id } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
  if (!doc) return null;
  return { locksmith, doc };
});
