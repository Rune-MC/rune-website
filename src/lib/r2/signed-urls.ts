import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Bucket, r2Client } from ".";

/** How long a presigned PUT stays valid. CLI must upload before this expires. */
export const PUT_EXPIRY_SECONDS = 15 * 60;
/** How long a presigned GET stays valid. */
export const GET_EXPIRY_SECONDS = 60 * 60;

export interface PresignedPut {
  url: string;
  expiresAt: string;
}

/**
 * Generate a presigned PUT URL. The CLI uploads the raw bytes directly to R2;
 * the website never proxies blob bytes through Vercel.
 *
 * Note on immutability: SPEC.md §9.2 expects the upload to reject if the blob
 * already exists. Cloudflare R2 supports `If-None-Match: *` on uploads. Today
 * we ALSO server-side dedupe (see `POST /api/v1/runes/:name/versions`), so
 * the CLI normally never uploads a hash that's already present.
 */
export async function presignedBlobPut(key: string): Promise<PresignedPut> {
  const cmd = new PutObjectCommand({
    Bucket: r2Bucket(),
    Key: key,
  });
  const url = await getSignedUrl(r2Client(), cmd, {
    expiresIn: PUT_EXPIRY_SECONDS,
  });
  return {
    url,
    expiresAt: new Date(Date.now() + PUT_EXPIRY_SECONDS * 1000).toISOString(),
  };
}

/**
 * Generate a presigned GET URL. Used for serving blobs/manifests with a
 * temporary URL that goes through R2's CDN.
 */
export async function presignedBlobGet(
  key: string,
  expiresIn = GET_EXPIRY_SECONDS,
): Promise<string> {
  const cmd = new GetObjectCommand({ Bucket: r2Bucket(), Key: key });
  return getSignedUrl(r2Client(), cmd, { expiresIn });
}

/**
 * Whether an object exists at `key`. Used by the finalize endpoint to verify
 * every blob referenced by the manifest has actually been uploaded.
 */
export async function blobExists(key: string): Promise<boolean> {
  try {
    await r2Client().send(
      new HeadObjectCommand({ Bucket: r2Bucket(), Key: key }),
    );
    return true;
  } catch (err) {
    const status = (err as { $metadata?: { httpStatusCode?: number } })
      ?.$metadata?.httpStatusCode;
    if (status === 404) return false;
    throw err;
  }
}
