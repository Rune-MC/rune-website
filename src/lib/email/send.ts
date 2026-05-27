import { emailFrom, isEmailConfigured, resend } from "./client";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface SendEmailResult {
  delivered: boolean;
  id?: string;
  reason?: string;
}

/**
 * Best-effort email send. Returns a result instead of throwing — callers
 * record `emailedAt` on the notification only when `delivered` is true.
 */
export async function sendEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  if (!isEmailConfigured()) {
    return { delivered: false, reason: "email_not_configured" };
  }
  if (!input.to) {
    return { delivered: false, reason: "no_recipient" };
  }

  try {
    const { data, error } = await resend().emails.send({
      from: emailFrom(),
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    if (error) {
      return { delivered: false, reason: error.message };
    }
    return { delivered: true, id: data?.id };
  } catch (err) {
    return {
      delivered: false,
      reason: err instanceof Error ? err.message : "unknown_error",
    };
  }
}
