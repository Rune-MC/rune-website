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
import { ORG_PERMISSIONS } from "@/lib/rbac/permissions";
import { can } from "@/lib/rbac/resolver";
import { canPublishVersion, resolveScopeOwner } from "@/lib/rune-ownership";

const params = z.object({
  name: z.string().regex(RUNE_NAME_PATTERN),
});

const body = z.object({
  manifest: manifestSchema,
  /**
   * Set when first publishing a Rune. Ignored for subsequent versions —
   * change visibility via PATCH /api/v1/runes/[name]/visibility.
   */
  visibility: z.enum(["public", "private"]).optional(),
});

const SCOPE_PATTERN = /^@([a-z0-9-]+)\/[a-z0-9-]+$/;

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

    let rune = await Rune.findOne({ name: params.name });
    if (rune) {
      const authz = await canPublishVersion(auth.user, rune);
      if (!authz.canPublish) {
        throw new Errors.Forbidden(authz.reason ?? "Cannot publish");
      }
      // Library status is locked once set. Subsequent versions must agree.
      const manifestLib = body.manifest.library === true;
      if (rune.isLibrary !== manifestLib) {
        throw new Errors.Conflict(
          rune.isLibrary
            ? `@${rune.name} was published as a library. Subsequent versions must keep \`library = true\` in rune.toml.`
            : `@${rune.name} was not published as a library. Drop \`library = true\` from rune.toml or publish under a new name.`,
        );
      }
    } else {
      // First publish — determine the owner from the scope.
      const scopeMatch = params.name.match(SCOPE_PATTERN);
      let ownerKind: "user" | "org" = "user";
      let ownerId = auth.user._id;

      if (scopeMatch) {
        const scope = scopeMatch[1];
        const resolved = await resolveScopeOwner(scope);
        if (!resolved) {
          throw new Errors.Forbidden(`@${scope} is not claimed`);
        }
        if (resolved.kind === "user") {
          if (String(resolved.id) !== String(auth.user._id)) {
            throw new Errors.Forbidden(`Not the owner of @${scope}/*`);
          }
        } else {
          // Org scope — check publish permission for the org.
          const allowed = await can(
            auth.user,
            ORG_PERMISSIONS.PACKAGE_PUBLISH,
            { orgId: resolved.id },
          );
          if (!allowed) {
            throw new Errors.Forbidden(
              `Missing publish permission for @${scope}`,
            );
          }
          ownerKind = "org";
          ownerId = resolved.id;
        }
      } else {
        // Unscoped — must be claimed by anyone yet. First publisher wins.
        ownerKind = "user";
        ownerId = auth.user._id;
      }

      rune = await Rune.create({
        name: params.name,
        description: body.manifest.metadata?.description,
        homepage: body.manifest.metadata?.homepage,
        repository: body.manifest.metadata?.repository,
        license: body.manifest.metadata?.license,
        ownerKind,
        ownerId,
        visibility: body.visibility ?? "public",
        isLibrary: body.manifest.library === true,
      });
    }

    const existing = await RuneVersion.findOne({
      runeId: rune._id,
      version: body.manifest.version,
    });
    if (existing) {
      throw new Errors.Conflict(
        `Version ${body.manifest.version} already exists`,
      );
    }

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

    const readmeBlobHash = body.manifest.metadata?.readme
      ? parseHash(body.manifest.metadata.readme)
      : undefined;

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
