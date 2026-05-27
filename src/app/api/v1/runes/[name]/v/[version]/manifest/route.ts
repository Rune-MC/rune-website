import { NextResponse } from "next/server";
import { z } from "zod";
import { Errors, route } from "@/lib/api";
import { connectDb, isDbConfigured } from "@/lib/db";
import { RUNE_NAME_PATTERN, Rune } from "@/lib/db/models/rune";
import { RuneVersion } from "@/lib/db/models/rune-version";
import { hashHex } from "@/lib/manifest";
import { isR2Configured } from "@/lib/r2";
import { manifestUrl } from "@/lib/r2/urls";

const params = z.object({
  name: z.string().regex(RUNE_NAME_PATTERN),
  version: z.string().min(1),
});

/**
 * 302 to the manifest blob in R2. The redirect is cacheable for a short
 * window; the manifest content at that hash is immutable forever.
 */
export const GET = route({
  auth: false,
  params,
  handler: async ({ params }) => {
    if (!isDbConfigured())
      throw new Errors.ServiceUnavailable("Database not configured");
    if (!isR2Configured())
      throw new Errors.ServiceUnavailable("Storage not configured");

    await connectDb();

    const rune = await Rune.findOne({ name: params.name }).lean();
    if (!rune) throw new Errors.NotFound("Rune not found");

    const version = await RuneVersion.findOne({
      runeId: rune._id,
      version: params.version,
    }).lean();
    if (!version || version.status === "pending") {
      throw new Errors.NotFound("Version not found");
    }

    const target = await manifestUrl(hashHex(version.manifestHash));
    const res = NextResponse.redirect(target, 302);
    res.headers.set("Cache-Control", "public, max-age=1800");
    return res;
  },
});
