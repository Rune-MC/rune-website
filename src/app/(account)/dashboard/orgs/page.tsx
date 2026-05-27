import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/server";
import { connectDb, isDbConfigured } from "@/lib/db";
import { userOrgs } from "@/lib/rbac/resolver";
import { CreateOrgButton } from "./create-org-button";

export const metadata: Metadata = {
  title: "Organizations",
};

export const dynamic = "force-dynamic";

export default async function OrgsPage() {
  const me = await currentUser();
  if (!me) redirect("/login?next=/dashboard/orgs");

  let orgs: Awaited<ReturnType<typeof userOrgs>> = [];
  if (isDbConfigured()) {
    await connectDb();
    orgs = await userOrgs(me.doc);
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <p className="mb-3 font-mono text-xs text-muted-foreground">orgs</p>
          <h1 className="text-2xl font-medium tracking-tight text-display sm:text-3xl">
            Organizations.
          </h1>
          <p className="mt-3 max-w-prose text-sm text-foreground">
            Group publishers under a shared scope. Each org owns
            <code> @&lt;org&gt;/* </code>and has its own members, roles, and
            published Runes.
          </p>
        </div>
        <CreateOrgButton />
      </div>

      <div className="mt-12">
        {orgs.length === 0 ? (
          <div className="rounded border border-dashed border-border px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              You aren't a member of any organizations yet.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Create one above, or accept an invitation if one was sent to{" "}
              <code>{me.doc.email ?? "your email"}</code>.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {orgs.map(({ org, roleKey, isOwner }) => (
              <li
                key={String(org._id)}
                className="flex items-baseline justify-between gap-4 py-4"
              >
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/orgs/${org.name}`}
                    className="font-mono text-sm text-foreground transition-colors hover:text-primary-hover"
                  >
                    @{org.name}
                  </Link>
                  {org.description && (
                    <p className="mt-1 max-w-prose truncate text-xs text-muted-foreground">
                      {org.description}
                    </p>
                  )}
                </div>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  {isOwner ? "owner" : roleKey}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
