import { z } from "zod";
import { Errors, requireScope, route } from "@/lib/api";
import { HASH_PATTERN } from "@/lib/manifest";
import { isR2Configured } from "@/lib/r2";
import { blobKey } from "@/lib/r2/keys";
import { blobExists } from "@/lib/r2/signed-urls";

const body = z.object({
  hashes: z.array(z.string().regex(HASH_PATTERN)).min(1).max(10_000),
});

/**
 * Fast pre-check the CLI runs before uploading. Returns which of the
 * requested hashes are already present in R2 (so the CLI can skip the
 * upload entirely) and which still need to be PUT.
 */
export const POST = route({
  auth: "any",
  body,
  handler: async ({ auth, body }) => {
    if (!isR2Configured()) {
      throw new Errors.ServiceUnavailable("Storage not configured");
    }
    requireScope(auth, "publish");

    const results = await Promise.all(
      body.hashes.map(async (hash) => {
        const hex = hash.slice("sha256:".length);
        const exists = await blobExists(blobKey(hex));
        return { hash, exists };
      }),
    );

    return {
      present: results.filter((r) => r.exists).map((r) => r.hash),
      missing: results.filter((r) => !r.exists).map((r) => r.hash),
    };
  },
});
