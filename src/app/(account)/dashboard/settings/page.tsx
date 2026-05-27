import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentLocksmithUser, currentUser } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const locksmith = await currentLocksmithUser();
  if (!locksmith) redirect("/login");

  const bridged = await currentUser();
  const username = bridged?.doc.username ?? null;

  return (
    <div>
      <p className="mb-3 font-mono text-xs text-muted-foreground">settings</p>
      <h1 className="text-2xl font-medium tracking-tight text-display sm:text-3xl">
        Settings.
      </h1>

      <div className="mt-12 max-w-xl divide-y divide-border">
        <article className="py-8">
          <h2 className="font-mono text-xs text-muted-foreground">identity</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex gap-3">
              <dt className="w-24 font-mono text-xs text-muted-foreground">
                email
              </dt>
              <dd className="text-foreground">{locksmith.email}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-24 font-mono text-xs text-muted-foreground">
                username
              </dt>
              <dd className="text-foreground">
                {username ? (
                  <code>@{username}</code>
                ) : (
                  <span className="text-muted-foreground">not set</span>
                )}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-muted-foreground">
            Identity is managed by Locksmith. Username is permanent once claimed
            (no rename in v1); maintainers can transfer ownership instead.
          </p>
        </article>

        <article className="py-8">
          <h2 className="font-mono text-xs text-muted-foreground">
            profile (coming soon)
          </h2>
          <p className="mt-4 text-sm text-foreground">
            Email visibility, display name, and signing-key controls land in
            Phase 6 polish.
          </p>
        </article>
      </div>
    </div>
  );
}
