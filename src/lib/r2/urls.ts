import { blobKey, manifestKey } from "./keys";
import { presignedBlobGet } from "./signed-urls";

/**
 * If a public R2 base URL is configured, return the stable, CDN-cached URL.
 * Otherwise return null so callers can fall back to a presigned GET.
 *
 * Set `R2_PUBLIC_BASE_URL` to either:
 *   - the bucket's `https://pub-<id>.r2.dev` URL, or
 *   - a custom domain attached to the R2 bucket
 *
 * R2 public buckets serve `blobs/<hex>` directly under that base, with
 * Cloudflare's CDN in front and immutable cache headers honored.
 */
export function publicR2Url(key: string): string | null {
  const base = process.env.R2_PUBLIC_BASE_URL;
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/${key}`;
}

export async function blobUrl(hashHex: string): Promise<string> {
  const key = blobKey(hashHex);
  return publicR2Url(key) ?? (await presignedBlobGet(key));
}

export async function manifestUrl(hashHex: string): Promise<string> {
  const key = manifestKey(hashHex);
  return publicR2Url(key) ?? (await presignedBlobGet(key));
}
