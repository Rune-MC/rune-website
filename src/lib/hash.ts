import { createHash, randomBytes } from "node:crypto";

export function sha256(input: string | Buffer): Buffer {
  return createHash("sha256").update(input).digest();
}

export function sha256Hex(input: string | Buffer): string {
  return sha256(input).toString("hex");
}

/**
 * Generates a CLI personal access token: `rune_pat_<24-byte url-safe random>`.
 * The raw token is shown once on the dashboard; only its sha256 hash is stored.
 */
export function generatePatToken(): string {
  return `rune_pat_${randomBytes(24).toString("base64url")}`;
}
