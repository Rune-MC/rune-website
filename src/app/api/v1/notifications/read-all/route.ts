import { Errors, ok, route } from "@/lib/api";
import { connectDb, isDbConfigured } from "@/lib/db";
import { Notification } from "@/lib/db/models/notification";

export const POST = route({
  auth: "session",
  handler: async ({ auth }) => {
    if (!isDbConfigured()) {
      throw new Errors.ServiceUnavailable("Database not configured");
    }
    await connectDb();
    const res = await Notification.updateMany(
      { userId: auth.user._id, readAt: null },
      { $set: { readAt: new Date() } },
    );
    return ok({ marked: res.modifiedCount });
  },
});
