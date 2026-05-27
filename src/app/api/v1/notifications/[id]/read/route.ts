import { z } from "zod";
import { Errors, ok, route } from "@/lib/api";
import { connectDb, isDbConfigured } from "@/lib/db";
import { Notification } from "@/lib/db/models/notification";

const params = z.object({ id: z.string() });

export const POST = route({
  auth: "session",
  params,
  handler: async ({ params, auth }) => {
    if (!isDbConfigured()) {
      throw new Errors.ServiceUnavailable("Database not configured");
    }
    await connectDb();
    const res = await Notification.updateOne(
      { _id: params.id, userId: auth.user._id, readAt: null },
      { $set: { readAt: new Date() } },
    );
    if (res.matchedCount === 0) {
      throw new Errors.NotFound("Notification not found");
    }
    return ok({ marked: true });
  },
});
