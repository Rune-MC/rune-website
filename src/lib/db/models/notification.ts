import mongoose, {
  type HydratedDocument,
  type InferSchemaType,
  type Model,
  Schema,
} from "mongoose";

export const NOTIFICATION_TYPES = [
  "org.invited",
  "org.member.joined",
  "org.member.removed",
  "org.role.changed",
  "rune.published",
  "rune.yanked",
  "rune.transferred",
  "platform.warning",
  "system",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

const notificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true, maxlength: 140 },
    body: { type: String, maxlength: 480 },
    /** Where clicking the notification should take the user. */
    href: String,
    /** Arbitrary structured payload (org id, rune name, version, etc). */
    data: { type: Schema.Types.Mixed, default: {} },
    readAt: { type: Date, default: null, index: true },
    /** Whether this notification was also sent over email. */
    emailedAt: Date,
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
    collection: "notifications",
  },
);

// Fast unread query per user.
notificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });

export type NotificationSchema = InferSchemaType<typeof notificationSchema>;
export type NotificationDoc = HydratedDocument<NotificationSchema>;

export const Notification: Model<NotificationSchema> =
  (mongoose.models.Notification as Model<NotificationSchema> | undefined) ??
  mongoose.model<NotificationSchema>("Notification", notificationSchema);
