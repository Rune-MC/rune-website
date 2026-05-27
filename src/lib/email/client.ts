import { Resend } from "resend";

let cached: Resend | null = null;

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export function resend(): Resend {
  if (!cached) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY not configured");
    cached = new Resend(key);
  }
  return cached;
}

export function emailFrom(): string {
  const from = process.env.EMAIL_FROM;
  if (!from) throw new Error("EMAIL_FROM not configured");
  return from;
}

export function siteOrigin(): string {
  return process.env.SITE_URL ?? "https://runemc.dev";
}
