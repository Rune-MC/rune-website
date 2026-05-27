import { z } from "zod";
import { Errors, route } from "@/lib/api";
import { connectDb, isDbConfigured } from "@/lib/db";
import { isReservedScope, isScopeTaken, SCOPE_PATTERN } from "@/lib/scope";

const body = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(32)
    .regex(SCOPE_PATTERN, "Lowercase letters, numbers, and hyphens only"),
});

export const POST = route({
  auth: "session",
  body,
  handler: async ({ auth, body }) => {
    if (!isDbConfigured()) throw new Errors.ServiceUnavailable();
    await connectDb();

    if (auth.user.username && auth.user.username !== body.username) {
      throw new Errors.Conflict(
        "Your scope is already set. Username changes aren't allowed.",
      );
    }

    if (isReservedScope(body.username)) {
      throw new Errors.Conflict(`@${body.username} is reserved`);
    }

    if (auth.user.username !== body.username) {
      const taken = await isScopeTaken(body.username);
      if (taken) {
        throw new Errors.Conflict(`@${body.username} is taken`);
      }
    }

    auth.user.username = body.username;
    await auth.user.save();

    return { username: body.username };
  },
});
