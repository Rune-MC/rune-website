import { z } from "zod";
import { Errors, route } from "@/lib/api";
import { connectDb, isDbConfigured } from "@/lib/db";
import { Rune } from "@/lib/db/models/rune";
import { RUNE_LANGUAGES, RuneVersion } from "@/lib/db/models/rune-version";

const query = z.object({
  q: z.string().trim().min(1).max(200),
  lang: z.enum(RUNE_LANGUAGES).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

interface SearchHit {
  name: string;
  description: string | null;
  latest_version: string | null;
  language: string | null;
  capabilities: string[];
  total_downloads: number;
  score: number;
}

/**
 * Full-text search over Rune name + description. Uses MongoDB's `$text`
 * operator backed by the index defined on the Rune model. Atlas Search is
 * a drop-in replacement for production tiers — swap the `$text` aggregation
 * for a `$search` stage and the response shape stays the same.
 */
export const GET = route({
  auth: false,
  query,
  handler: async ({ query }) => {
    if (!isDbConfigured()) {
      throw new Errors.ServiceUnavailable("Database not configured");
    }
    await connectDb();

    const runes = await Rune.find(
      { $text: { $search: query.q } },
      { score: { $meta: "textScore" } },
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(query.limit)
      .lean();

    if (runes.length === 0) {
      return { query: query.q, total: 0, results: [] };
    }

    // Join latest version metadata in one round-trip.
    const latestVersionIds = runes
      .map((r) => r.latestVersionId)
      .filter((id): id is NonNullable<typeof id> => Boolean(id));

    const latest = await RuneVersion.find({
      _id: { $in: latestVersionIds },
    })
      .lean()
      .then((versions) => {
        const byId = new Map(versions.map((v) => [String(v._id), v]));
        return byId;
      });

    let hits: SearchHit[] = runes.map((r) => {
      const v = r.latestVersionId
        ? latest.get(String(r.latestVersionId))
        : undefined;
      return {
        name: r.name,
        description: r.description ?? null,
        latest_version: r.latestVersion ?? null,
        language: v?.language ?? null,
        capabilities: v?.capabilities ?? [],
        total_downloads: r.totalDownloads ?? 0,
        // Mongoose returns score on the doc itself when projected with $meta.
        score: (r as unknown as { score?: number }).score ?? 0,
      };
    });

    if (query.lang) {
      hits = hits.filter((h) => h.language === query.lang);
    }

    return { query: query.q, total: hits.length, results: hits };
  },
});
