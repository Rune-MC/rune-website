import { z } from "zod";
import { Errors, route } from "@/lib/api";
import { connectDb, isDbConfigured } from "@/lib/db";
import { Notification } from "@/lib/db/models/notification";

const query = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unread: z.coerce.boolean().optional(),
});

export const GET = route({
  auth: "session",
  query,
  handler: async ({ query, auth }) => {
    if (!isDbConfigured()) {
      throw new Errors.ServiceUnavailable("Database not configured");
    }
    await connectDb();

    const filter: Record<string, unknown> = { userId: auth.user._id };
    if (query.unread) filter.readAt = null;
    if (query.cursor) filter._id = { $lt: query.cursor };

    const items = await Notification.find(filter)
      .sort({ _id: -1 })
      .limit(query.limit + 1)
      .lean();

    const hasMore = items.length > query.limit;
    const page = hasMore ? items.slice(0, query.limit) : items;
    const nextCursor = hasMore ? String(page[page.length - 1]._id) : null;

    const unreadCount = await Notification.countDocuments({
      userId: auth.user._id,
      readAt: null,
    });

    return {
      items: page.map((n) => ({
        id: String(n._id),
        type: n.type,
        title: n.title,
        body: n.body ?? null,
        href: n.href ?? null,
        data: n.data ?? {},
        read_at: n.readAt?.toISOString() ?? null,
        created_at:
          n.createdAt instanceof Date ? n.createdAt.toISOString() : null,
      })),
      next_cursor: nextCursor,
      unread_count: unreadCount,
    };
  },
});
