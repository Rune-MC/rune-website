import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDb, isDbConfigured } from "@/lib/db";
import { Rune } from "@/lib/db/models/rune";
import { runeNameToUrl } from "@/lib/runebook-urls";

export const dynamic = "force-dynamic";

export default async function AdminRunesPage({
  searchParams,
}: PageProps<"/admin/runes">) {
  if (!isDbConfigured()) notFound();
  await connectDb();

  const sp = await searchParams;
  const q =
    typeof sp.q === "string" ? sp.q.trim() : Array.isArray(sp.q) ? sp.q[0] : "";

  const filter = q ? { name: { $regex: q, $options: "i" } } : {};
  const runes = await Rune.find(filter)
    .sort({ updatedAt: -1 })
    .limit(100)
    .lean();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-medium tracking-tight text-display">
          Runes
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {runes.length} shown (max 100).
        </p>
      </div>

      <form action="/admin/runes" method="GET" className="max-w-md">
        <input
          name="q"
          type="search"
          defaultValue={q}
          placeholder="search by name..."
          className="w-full rounded border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-primary"
        />
      </form>

      <ul className="divide-y divide-border">
        {runes.map((r) => (
          <li
            key={String(r._id)}
            className="flex flex-wrap items-baseline justify-between gap-3 py-3"
          >
            <div className="min-w-0">
              <Link
                href={`/admin/runes/${encodeURIComponent(r.name)}`}
                className="font-mono text-sm text-foreground transition-colors hover:text-primary-hover"
              >
                {r.name}
              </Link>
              <p className="mt-0.5 text-xs text-muted-foreground">
                v{r.latestVersion ?? "—"} ·{" "}
                {r.totalDownloads?.toLocaleString() ?? 0} downloads ·{" "}
                <Link
                  href={`/runebook/r/${runeNameToUrl(r.name)}`}
                  className="transition-colors hover:text-foreground"
                >
                  view public →
                </Link>
              </p>
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              {r.ownerKind}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
