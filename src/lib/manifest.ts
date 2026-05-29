import { createHash } from "node:crypto";
import { z } from "zod";

/** `sha256:<64 hex chars>`. The format the CLI emits and the registry trusts. */
export const HASH_PATTERN = /^sha256:[a-f0-9]{64}$/;

const hashString = z
  .string()
  .regex(HASH_PATTERN, "Expected sha256:<64 hex chars>");

const semver = z
  .string()
  .regex(
    /^[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9a-z.-]+)?(?:\+[0-9a-z.-]+)?$/i,
    "Expected semver (e.g. 1.2.0 or 1.2.0-beta.1)",
  );

const runeName = z
  .string()
  .regex(
    /^(?:@[a-z0-9-]+\/)?[a-z0-9-]+$/,
    "Lowercase letters, numbers, hyphens. Optional `@scope/`.",
  );

export const fileEntrySchema = z.object({
  path: z.string().min(1).max(512),
  hash: hashString,
  size: z.number().int().nonnegative(),
});
export type FileEntry = z.infer<typeof fileEntrySchema>;

const authorSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().optional(),
  github: z.string().max(120).optional(),
});

const RUNE_LANGUAGES = ["typescript", "wasm", "python", "lua", "rust"] as const;

export const manifestSchema = z.object({
  name: runeName,
  version: semver,
  language: z.enum(RUNE_LANGUAGES),
  entry: z.string().min(1).max(512),
  files: z.array(fileEntrySchema).min(1).max(10_000),
  /**
   * Library Runes are boilerplate / utility code consumed by other Runes.
   * The host never executes a library directly — it's just installed for
   * import. Omitted by default so existing manifest hashes stay stable.
   */
  library: z.boolean().optional(),
  capabilities: z.array(z.string().min(1).max(120)).default([]),
  dependencies: z.record(z.string(), z.string()).default({}),
  metadata: z
    .object({
      description: z.string().max(280).optional(),
      license: z.string().max(120).optional(),
      homepage: z.string().url().optional(),
      repository: z.string().url().optional(),
      authors: z.array(authorSchema).optional(),
      keywords: z.array(z.string().max(40)).max(20).optional(),
      readme: hashString.optional(),
    })
    .optional(),
  compiler: z
    .object({
      esbuild: z.string().optional(),
      target: z.string().optional(),
      preset: z.string().optional(),
    })
    .optional(),
});

export type Manifest = z.infer<typeof manifestSchema>;

/**
 * Deterministic JSON serializer. Two manifests with the same logical content
 * always produce the same bytes:
 *   - keys sorted at every depth
 *   - no insignificant whitespace
 *   - `undefined` properties omitted
 *   - UTF-8 (returned as a string; the caller can `Buffer.from(str, "utf-8")`)
 */
export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const props = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`);
  return `{${props.join(",")}}`;
}

export function manifestBytes(manifest: Manifest): Buffer {
  return Buffer.from(canonicalize(manifest), "utf-8");
}

export function manifestHash(manifest: Manifest): Buffer {
  return createHash("sha256").update(manifestBytes(manifest)).digest();
}

/**
 * Convert a `sha256:<hex>` string into the 32-byte Buffer used in DB storage
 * and R2 keys.
 */
export function parseHash(value: string): Buffer {
  if (!HASH_PATTERN.test(value)) {
    throw new Error(`Invalid hash: ${value}`);
  }
  return Buffer.from(value.slice("sha256:".length), "hex");
}

export function formatHash(buf: Buffer): string {
  return `sha256:${buf.toString("hex")}`;
}

/** Lowercase hex string (no `sha256:` prefix). Useful for R2 keys. */
export function hashHex(buf: Buffer): string {
  return buf.toString("hex");
}
