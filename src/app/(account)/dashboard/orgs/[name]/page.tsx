import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDb, isDbConfigured } from "@/lib/db";
import { Org } from "@/lib/db/models/org";
import { OrgMember } from "@/lib/db/models/org-member";
import { Rune } from "@/lib/db/models/rune";
import { runeNameToUrl } from "@/lib/runebook-urls";

export const dynamic = "force-dynamic";

export default async function OrgOverviewPage({
  params,
}: PageProps<"/dashboard/orgs/[name]">) {
  if (!isDbConfigured()) notFound();
  await connectDb();
  const { name } = await params;

  const org = await Org.findOne({ name: String(name).toLowerCase() }).lean();
  if (!org) notFound();

  const [memberCount, runes] = await Promise.all([
    OrgMember.countDocuments({ orgId: org._id }),
    Rune.find({ ownerKind: "org", ownerId: org._id })
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean(),
  ]);

  return (
    <div className="space-y-12">
      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="members" value={String(memberCount)} />
        <Stat label="published runes" value={String(runes.length)} />
        <Stat
          label="downloads"
          value={runes
            .reduce((sum, r) => sum + (r.totalDownloads ?? 0), 0)
            .toLocaleString()}
        />
      </section>

      <section>
        <h2 className="font-mono text-xs text-muted-foreground">runes</h2>
        {runes.length === 0 ? (
          <div className="mt-4 rounded border border-dashed border-border px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No Runes published under <code>@{org.name}/*</code> yet.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Members with the <code>org.package.publish</code> permission can
              ship one via <code>rune publish</code>.
            </p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {runes.map((r) => (
              <li
                key={r.name}
                className="flex items-baseline justify-between gap-4 py-3"
              >
                <Link
                  href={`/runebook/r/${runeNameToUrl(r.name)}`}
                  className="font-mono text-sm text-foreground transition-colors hover:text-primary-hover"
                >
                  {r.name}
                </Link>
                <span className="font-mono text-xs text-muted-foreground">
                  v{r.latestVersion ?? "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border px-5 py-4">
      <p className="font-mono text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-medium text-display">{value}</p>
    </div>
  );
}
