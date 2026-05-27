import { NextResponse } from "next/server";
import { z } from "zod";
import { Errors, route } from "@/lib/api";
import { connectDb, isDbConfigured } from "@/lib/db";
import { RUNE_NAME_PATTERN, Rune } from "@/lib/db/models/rune";
import { RuneVersion } from "@/lib/db/models/rune-version";
import { formatHash } from "@/lib/manifest";
import { canReadRune } from "@/lib/rune-ownership";

const params = z.object({
  name: z.string().regex(RUNE_NAME_PATTERN),
  version: z.string().min(1),
});

export const GET = route({
  auth: "optional",
  params,
  handler: async ({ params, auth }) => {
    if (!isDbConfigured()) {
      throw new Errors.ServiceUnavailable("Database not configured");
    }
    await connectDb();

    const rune = await Rune.findOne({ name: params.name }).lean();
    if (!rune) throw new Errors.NotFound("Rune not found");

    const visible = await canReadRune(auth?.user ?? null, rune);
    if (!visible) throw new Errors.NotFound("Rune not found");

    const version = await RuneVersion.findOne({
      runeId: rune._id,
      version: params.version,
    }).lean();
    if (!version || version.status === "pending") {
      throw new Errors.NotFound("Version not found");
    }

    const body = {
      success: true as const,
      code: 200,
      data: {
        name: rune.name,
        version: version.version,
        language: version.language,
        manifest_hash: formatHash(version.manifestHash),
        capabilities: version.capabilities,
        archive_size_bytes: version.archiveSizeBytes ?? 0,
        published_at:
          version.publishedAt instanceof Date
            ? version.publishedAt.toISOString()
            : null,
        yanked: version.status === "yanked",
        yanked_reason: version.yankedReason ?? null,
      },
    };

    // Private Runes must not be cached by intermediaries since the
    // visibility check is per-request. Public versions are immutable.
    const cacheControl =
      rune.visibility === "private"
        ? "private, no-store"
        : version.status === "yanked"
          ? "public, max-age=300"
          : "public, max-age=31536000, immutable";

    return NextResponse.json(body, {
      status: 200,
      headers: { "Cache-Control": cacheControl },
    });
  },
});
