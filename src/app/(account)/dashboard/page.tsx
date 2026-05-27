import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentLocksmithUser, currentUser } from "@/lib/auth/server";
import { connectDb, isDbConfigured } from "@/lib/db";
import { Rune } from "@/lib/db/models/rune";
import { runeNameToUrl } from "@/lib/runebook-urls";

export const metadata: Metadata = {
  title: "Dashboard",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const locksmith = await currentLocksmithUser();
  if (!locksmith) redirect("/login");

  const bridged = await currentUser();
  const username = bridged?.doc.username ?? null;

  let runes: Array<{
    name: string;
    latestVersion: string | null;
    totalDownloads: number;
    updatedAt: string | null;
  }> = [];

  if (bridged && isDbConfigured()) {
    await connectDb();
    const docs = await Rune.find({
      "owners.userId": bridged.doc._id,
      latestVersionId: { $exists: true },
    })
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();
    runes = docs.map((r) => ({
      name: r.name,
      latestVersion: r.latestVersion ?? null,
      totalDownloads: r.totalDownloads ?? 0,
      updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : null,
    }));
  }

  return (
    <div>
      <p className="mb-6 font-mono text-xs text-muted-foreground">overview</p>
      <h1 className="text-2xl font-medium tracking-tight text-display sm:text-3xl">
        Your Runes.
      </h1>
      <p className="mt-3 max-w-prose text-sm text-foreground">
        Signed in as <code>{locksmith.email}</code>.
      </p>

      <div className="mt-12 divide-y divide-border">
        <article className="py-10">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-mono text-xs text-muted-foreground">
              published
            </h2>
            <span className="font-mono text-xs text-muted-foreground">
              {runes.length} {runes.length === 1 ? "rune" : "runes"}
            </span>
          </div>
          {runes.length === 0 ? (
            <div className="mt-4 rounded border border-dashed border-border px-6 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                You haven't published any Runes yet.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Issue a CLI token from{" "}
                <Link
                  href="/dashboard/tokens"
                  className="text-primary transition-colors hover:text-primary-hover"
                >
                  tokens
                </Link>
                , then run <code>rune publish</code>.
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
                    className="group flex min-w-0 items-baseline gap-3"
                  >
                    <span className="truncate font-mono text-sm text-foreground transition-colors group-hover:text-primary-hover">
                      {r.name}
                    </span>
                    {r.latestVersion && (
                      <span className="font-mono text-xs text-muted-foreground">
                        v{r.latestVersion}
                      </span>
                    )}
                  </Link>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {r.totalDownloads.toLocaleString()}{" "}
                    {r.totalDownloads === 1 ? "install" : "installs"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="py-10">
          <h2 className="font-mono text-xs text-muted-foreground">scope</h2>
          {username ? (
            <>
              <p className="mt-3 text-sm text-foreground">
                Your Runebook scope is <code>@{username}/*</code>.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Every Rune you publish lives under this scope.{" "}
                <Link
                  href={`/runebook/u/${username}`}
                  className="text-primary transition-colors hover:text-primary-hover"
                >
                  view public profile →
                </Link>
              </p>
            </>
          ) : (
            <>
              <p className="mt-3 text-sm text-foreground">
                Your username (the <code>@&lt;username&gt;/...</code> scope on
                Runebook) isn't set yet.
              </p>
              <Link
                href="/dashboard/welcome"
                className="mt-3 inline-block font-mono text-sm text-primary transition-colors hover:text-primary-hover"
              >
                pick a username →
              </Link>
            </>
          )}
        </article>
      </div>
    </div>
  );
}
