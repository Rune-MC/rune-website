import { PutObjectCommand } from "@aws-sdk/client-s3";
import { z } from "zod";
import { Errors, requireScope, route } from "@/lib/api";
import { connectDb, isDbConfigured } from "@/lib/db";
import { RUNE_NAME_PATTERN, Rune } from "@/lib/db/models/rune";
import { RuneVersion } from "@/lib/db/models/rune-version";
import {
  formatHash,
  hashHex,
  manifestBytes,
  manifestHash,
  manifestSchema,
  parseHash,
} from "@/lib/manifest";
import { isR2Configured, r2Bucket, r2Client } from "@/lib/r2";
import { blobKey, manifestKey } from "@/lib/r2/keys";
import { blobExists, presignedBlobPut } from "@/lib/r2/signed-urls";

const params = z.object({
  name: z.string().regex(RUNE_NAME_PATTERN),
});

const body = z.object({
  manifest: manifestSchema,
});

const SCOPE_PATTERN = /^@([a-z0-9-]+)\/[a-z0-9-]+$/;

/**
 * Create a new version (pending). Stores the manifest in R2 + Mongo, returns
 * presigned PUT URLs for any blobs not already in R2.
 *
 * The version stays in `pending` state until `finalize` is called.
 */
export const POST = route({
  auth: "any",
  params,
  body,
  handler: async ({ params, body, auth }) => {
    if (!isDbConfigured()) {
      throw new Errors.ServiceUnavailable("Database not configured");
    }
    if (!isR2Configured()) {
      throw new Errors.ServiceUnavailable("Storage not configured");
    }
    requireScope(auth, "publish");

    if (body.manifest.name !== params.name) {
      throw new Errors.BadRequest(
        `Manifest name "${body.manifest.name}" doesn't match URL "${params.name}"`,
      );
    }

    await connectDb();

    // Scope check: `@scope/name` requires `auth.user.username === scope`.
    const scopeMatch = params.name.match(SCOPE_PATTERN);
    if (scopeMatch) {
      const scope = scopeMatch[1];
      if (!auth.user.username) {
        throw new Errors.Forbidden(
          "Claim a username before publishing scoped Runes",
        );
      }
      if (auth.user.username !== scope) {
        throw new Errors.Forbidden(`Not the owner of @${scope}/*`);
      }
    }

    // Find or claim the Rune doc.
    let rune = await Rune.findOne({ name: params.name });
    if (rune) {
      const isOwner = rune.owners.some(
        (o) => String(o.userId) === String(auth.user._id),
      );
      if (!isOwner) throw new Errors.Forbidden("Not an owner of this Rune");
    } else {
      rune = await Rune.create({
        name: params.name,
        description: body.manifest.metadata?.description,
        homepage: body.manifest.metadata?.homepage,
        repository: body.manifest.metadata?.repository,
        license: body.manifest.metadata?.license,
        owners: [{ userId: auth.user._id, role: "owner" }],
      });
    }

    // Version uniqueness.
    const existing = await RuneVersion.findOne({
      runeId: rune._id,
      version: body.manifest.version,
    });
    if (existing) {
      throw new Errors.Conflict(
        `Version ${body.manifest.version} already exists`,
      );
    }

    // Compute manifest hash + upload to R2 (manifests/<hex>).
    const mBytes = manifestBytes(body.manifest);
    const mHash = manifestHash(body.manifest);
    const mHashHex = hashHex(mHash);
    await r2Client().send(
      new PutObjectCommand({
        Bucket: r2Bucket(),
        Key: manifestKey(mHashHex),
        Body: mBytes,
        ContentType: "application/json",
      }),
    );

    // Determine which file blobs are missing from R2.
    const blobBuffers = body.manifest.files.map((f) => parseHash(f.hash));
    const blobHexes = blobBuffers.map(hashHex);
    const existsChecks = await Promise.all(
      blobHexes.map(async (hex) => ({
        hex,
        exists: await blobExists(blobKey(hex)),
      })),
    );
    const missingHexes = existsChecks
      .filter((c) => !c.exists)
      .map((c) => c.hex);

    const missingBlobs = await Promise.all(
      missingHexes.map(async (hex) => {
        const presigned = await presignedBlobPut(blobKey(hex));
        return {
          hash: `sha256:${hex}`,
          upload_url: presigned.url,
          expires_at: presigned.expiresAt,
        };
      }),
    );

    // Optional readme pointer.
    const readmeBlobHash = body.manifest.metadata?.readme
      ? parseHash(body.manifest.metadata.readme)
      : undefined;

    // Create the pending version doc.
    const version = await RuneVersion.create({
      runeId: rune._id,
      version: body.manifest.version,
      language: body.manifest.language,
      manifestHash: mHash,
      archiveSizeBytes: body.manifest.files.reduce((s, f) => s + f.size, 0),
      capabilities: body.manifest.capabilities,
      blobHashes: blobBuffers,
      readmeBlobHash,
      status: "pending",
      publishedBy: auth.user._id,
    });

    return {
      manifest_hash: formatHash(mHash),
      missing_blobs: missingBlobs,
      version_id: String(version._id),
    };
  },
});
