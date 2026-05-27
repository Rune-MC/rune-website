import { GetObjectCommand } from "@aws-sdk/client-s3";
import { r2Bucket, r2Client } from ".";
import { blobKey, manifestKey } from "./keys";

/** Maximum bytes we fetch for in-browser preview. */
export const PREVIEW_MAX_BYTES = 1_500_000;

export interface BlobFetchResult {
  bytes: Buffer;
  truncated: boolean;
  totalSize: number;
}

/**
 * Fetch up to `PREVIEW_MAX_BYTES` of a blob via HTTP Range request. We never
 * want to pull a 100 MB asset back through the server, so this caps the
 * download and reports whether truncation happened.
 */
export async function fetchBlobPreview(
  hashHex: string,
): Promise<BlobFetchResult> {
  const cmd = new GetObjectCommand({
    Bucket: r2Bucket(),
    Key: blobKey(hashHex),
    Range: `bytes=0-${PREVIEW_MAX_BYTES - 1}`,
  });
  const response = await r2Client().send(cmd);
  const stream = response.Body;
  if (!stream) throw new Error("Blob body empty");
  const bytes = Buffer.from(await stream.transformToByteArray());

  // ContentRange looks like "bytes 0-1499999/8453121"
  const range = response.ContentRange;
  let totalSize = bytes.length;
  if (range) {
    const slash = range.lastIndexOf("/");
    const total =
      slash >= 0 ? Number.parseInt(range.slice(slash + 1), 10) : NaN;
    if (Number.isFinite(total)) totalSize = total;
  }
  return {
    bytes,
    truncated: bytes.length < totalSize,
    totalSize,
  };
}

/**
 * Fetch + parse a manifest JSON from R2. Throws if the object is missing
 * or doesn't parse as JSON. The caller should catch + render a friendly error.
 */
export async function fetchManifestJson(
  hashHex: string,
): Promise<Record<string, unknown>> {
  const cmd = new GetObjectCommand({
    Bucket: r2Bucket(),
    Key: manifestKey(hashHex),
  });
  const response = await r2Client().send(cmd);
  const body = await response.Body?.transformToString("utf-8");
  if (!body) throw new Error("Manifest body empty");
  return JSON.parse(body) as Record<string, unknown>;
}
