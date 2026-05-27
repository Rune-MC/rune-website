import { z } from "zod";
import { Errors, route } from "@/lib/api";
import { connectDb, isDbConfigured } from "@/lib/db";
import { User } from "@/lib/db/models/user";

const body = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(32)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
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

    const existing = await User.findOne({ username: body.username });
    if (existing && String(existing._id) !== String(auth.user._id)) {
      throw new Errors.Conflict(`@${body.username} is taken`);
    }

    auth.user.username = body.username;
    await auth.user.save();

    return { username: body.username };
  },
});
