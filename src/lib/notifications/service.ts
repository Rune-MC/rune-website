import type { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import {
  Notification,
  type NotificationType,
} from "@/lib/db/models/notification";
import { User } from "@/lib/db/models/user";
import { siteOrigin } from "@/lib/email/client";
import { sendEmail } from "@/lib/email/send";
import { notificationEmail } from "@/lib/email/templates";

export interface NotifyInput {
  userId: string | Types.ObjectId;
  type: NotificationType;
  title: string;
  body?: string;
  href?: string;
  data?: Record<string, unknown>;
  /**
   * Send a transactional email mirror of this notification. Default true.
   * Set false for noisy notifications (e.g. download milestones).
   */
  email?: boolean;
}

/**
 * Single entry point for delivering a notification. Writes the DB row,
 * fires-and-forgets the email if requested, and stamps `emailedAt` if the
 * provider accepts the message. Callers can ignore the return value.
 */
export async function notify(input: NotifyInput) {
  await connectDb();
  const doc = await Notification.create({
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    href: input.href,
    data: input.data ?? {},
  });

  const shouldEmail = input.email ?? true;
  if (!shouldEmail) return doc;

  void deliverEmail(doc._id, input).catch((err) => {
    console.error("[notifications] email delivery failed:", err);
  });
  return doc;
}

async function deliverEmail(
  notificationId: Types.ObjectId,
  input: NotifyInput,
): Promise<void> {
  const user = await User.findById(input.userId).select({ email: 1 }).lean();
  if (!user?.email) return;

  const origin = siteOrigin();
  const href = input.href
    ? input.href.startsWith("http")
      ? input.href
      : `${origin}${input.href}`
    : undefined;

  const { subject, html, text } = notificationEmail({
    origin,
    title: input.title,
    bodyHtml: input.body
      ? `<p style="margin:0;">${escapeHtml(input.body)}</p>`
      : "<p>&nbsp;</p>",
    bodyText: input.body ?? "",
    cta: href ? { label: "View on Runebook", href } : undefined,
    preheader: input.body ?? input.title,
  });

  const result = await sendEmail({ to: user.email, subject, html, text });
  if (result.delivered) {
    await Notification.updateOne(
      { _id: notificationId },
      { $set: { emailedAt: new Date() } },
    );
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
