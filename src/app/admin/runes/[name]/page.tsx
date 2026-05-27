import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDb, isDbConfigured } from "@/lib/db";
import { Org } from "@/lib/db/models/org";
import { Rune } from "@/lib/db/models/rune";
import { RuneVersion } from "@/lib/db/models/rune-version";
import { User } from "@/lib/db/models/user";
import { runeNameToUrl } from "@/lib/runebook-urls";
import { RuneAdminActions } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminRuneDetail({
  params,
}: PageProps<"/admin/runes/[name]">) {
  if (!isDbConfigured()) notFound();
  await connectDb();
  const { name } = await params;

  const rune = await Rune.findOne({ name: String(name).toLowerCase() }).lean();
  if (!rune) notFound();

  const [versions, ownerLabel] = await Promise.all([
    RuneVersion.find({ runeId: rune._id })
      .sort({ publishedAt: -1, createdAt: -1 })
      .lean(),
    resolveOwnerLabel(rune.ownerKind, rune.ownerId),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-xs text-muted-foreground">
          <Link
            href="/admin/runes"
            className="transition-colors hover:text-foreground"
          >
            runes
          </Link>
          {" · "}
          {rune.name}
        </p>
        <h1 className="mt-2 font-mono text-2xl text-display">{rune.name}</h1>
        {rune.description && (
          <p className="mt-2 max-w-prose text-sm text-foreground">
            {rune.description}
          </p>
        )}
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <Row label="owner" value={ownerLabel} />
        <Row label="latest" value={rune.latestVersion ?? "—"} />
        <Row label="versions" value={String(versions.length)} />
        <Row
          label="downloads"
          value={(rune.totalDownloads ?? 0).toLocaleString()}
        />
        <Row
          label="created"
          value={
            rune.createdAt instanceof Date
              ? rune.createdAt.toISOString().slice(0, 10)
              : "—"
          }
        />
        <Row
          label="public link"
          value={
            <Link
              href={`/runebook/r/${runeNameToUrl(rune.name)}`}
              className="text-primary transition-colors hover:text-primary-hover"
            >
              /runebook/r/{rune.name}
            </Link>
          }
        />
      </dl>

      <section>
        <h2 className="font-mono text-xs text-muted-foreground">versions</h2>
        <ul className="mt-3 divide-y divide-border">
          {versions.map((v) => (
            <li
              key={String(v._id)}
              className="flex flex-wrap items-baseline justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="font-mono text-sm text-foreground">
                  v{v.version}
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                  {v.status}
                  {v.yankedReason ? ` · ${v.yankedReason}` : ""}
                </p>
              </div>
              <span className="font-mono text-xs text-muted-foreground">
                {v.publishedAt instanceof Date
                  ? v.publishedAt.toISOString().slice(0, 10)
                  : "—"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <RuneAdminActions
        name={rune.name}
        versions={versions.map((v) => ({
          version: v.version,
          status: v.status,
        }))}
      />
    </div>
  );
}

async function resolveOwnerLabel(
  kind: string,
  id: unknown,
): Promise<React.ReactNode> {
  if (kind === "user") {
    const u = await User.findById(id)
      .select({ username: 1, githubLogin: 1 })
      .lean();
    if (!u) return "user (deleted)";
    return (
      <Link
        href={`/admin/users/${String(u._id)}`}
        className="text-primary transition-colors hover:text-primary-hover"
      >
        @{u.username ?? u.githubLogin}
      </Link>
    );
  }
  const o = await Org.findById(id).select({ name: 1 }).lean();
  if (!o) return "org (deleted)";
  return (
    <span className="font-mono text-foreground">
      @{o.name}{" "}
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        org
      </span>
    </span>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="w-24 shrink-0 font-mono text-xs text-muted-foreground">
        {label}
      </dt>
      <dd className="min-w-0 text-foreground">{value}</dd>
    </div>
  );
}
