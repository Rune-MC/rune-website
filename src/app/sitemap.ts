import type { MetadataRoute } from "next";
import { connectDb, isDbConfigured } from "@/lib/db";
import { Rune } from "@/lib/db/models/rune";
import { runeNameToUrl } from "@/lib/runebook-urls";
import { siteConfig } from "@/lib/site-config";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: `${base}/install`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/docs`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${base}/runebook`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${base}/runebook/publish`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  if (!isDbConfigured()) return staticEntries;

  try {
    await connectDb();
    const runes = await Rune.find({ latestVersionId: { $exists: true } })
      .select({ name: 1, updatedAt: 1 })
      .sort({ updatedAt: -1 })
      .limit(5000)
      .lean();

    const runeEntries: MetadataRoute.Sitemap = runes.map((r) => ({
      url: `${base}/runebook/r/${runeNameToUrl(r.name)}`,
      lastModified: r.updatedAt instanceof Date ? r.updatedAt : now,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    return [...staticEntries, ...runeEntries];
  } catch {
    return staticEntries;
  }
}
