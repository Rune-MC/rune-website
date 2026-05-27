import { NextResponse } from "next/server";
import { z } from "zod";
import { Errors, route } from "@/lib/api";
import { isR2Configured } from "@/lib/r2";
import { blobUrl } from "@/lib/r2/urls";

const params = z.object({
  hash: z
    .string()
    .regex(/^[a-f0-9]{64}$/i, "Expected 64 hex chars (sha256, no prefix)"),
});

/**
 * 302 to the blob bytes in R2. The URL parameter is the bare hex sha256
 * (no `sha256:` prefix); blobs are immutable, so the redirect is cacheable.
 */
export const GET = route({
  auth: false,
  params,
  handler: async ({ params }) => {
    if (!isR2Configured()) {
      throw new Errors.ServiceUnavailable("Storage not configured");
    }

    const target = await blobUrl(params.hash.toLowerCase());
    const res = NextResponse.redirect(target, 302);
    res.headers.set("Cache-Control", "public, max-age=1800");
    return res;
  },
});
