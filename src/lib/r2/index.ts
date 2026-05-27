import { S3Client } from "@aws-sdk/client-s3";

interface R2EnvSnapshot {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

interface R2Cache {
  client: S3Client;
  snapshot: R2EnvSnapshot;
}

const globalForR2 = globalThis as unknown as {
  __runeR2?: R2Cache;
};

function readEnv(): R2EnvSnapshot | null {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) return null;
  return { endpoint, accessKeyId, secretAccessKey, bucket };
}

export function isR2Configured(): boolean {
  return readEnv() !== null;
}

export function r2Client(): S3Client {
  const env = readEnv();
  if (!env) {
    throw new Error(
      "R2 not configured. Set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET.",
    );
  }
  const cached = globalForR2.__runeR2;
  if (cached && envEquals(cached.snapshot, env)) return cached.client;

  const client = new S3Client({
    region: "auto",
    endpoint: env.endpoint,
    credentials: {
      accessKeyId: env.accessKeyId,
      secretAccessKey: env.secretAccessKey,
    },
  });
  globalForR2.__runeR2 = { client, snapshot: env };
  return client;
}

export function r2Bucket(): string {
  const env = readEnv();
  if (!env) throw new Error("R2_BUCKET not configured");
  return env.bucket;
}

function envEquals(a: R2EnvSnapshot, b: R2EnvSnapshot): boolean {
  return (
    a.endpoint === b.endpoint &&
    a.accessKeyId === b.accessKeyId &&
    a.secretAccessKey === b.secretAccessKey &&
    a.bucket === b.bucket
  );
}
