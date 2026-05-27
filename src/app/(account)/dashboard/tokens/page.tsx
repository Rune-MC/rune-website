import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/server";
import { connectDb, isDbConfigured } from "@/lib/db";
import { ApiToken } from "@/lib/db/models/api-token";
import type { TokenSummary } from "@/lib/query/tokens";
import { CreateTokenButton } from "./create-token-button";
import { TokenList } from "./token-list";

export const metadata: Metadata = {
  title: "API Tokens",
};

export const dynamic = "force-dynamic";

export default async function TokensPage() {
  const bridged = await currentUser();
  if (!bridged) {
    // DB not wired (or signed out). Show the empty state.
    return <EmptyShell dbConfigured={isDbConfigured()} />;
  }

  await connectDb();
  const tokens = await ApiToken.find({
    userId: bridged.doc._id,
    revokedAt: { $exists: false },
  })
    .sort({ createdAt: -1 })
    .lean();

  const summaries: TokenSummary[] = tokens.map((t) => ({
    id: String(t._id),
    name: t.name,
    scopes: t.scopes,
    createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : null,
    lastUsedAt:
      t.lastUsedAt instanceof Date ? t.lastUsedAt.toISOString() : null,
  }));

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <p className="mb-3 font-mono text-xs text-muted-foreground">tokens</p>
          <h1 className="text-2xl font-medium tracking-tight text-display sm:text-3xl">
            API tokens.
          </h1>
          <p className="mt-3 max-w-prose text-sm text-foreground">
            Personal access tokens for the Rune CLI. Format:{" "}
            <code>rune_pat_*</code>. The raw token is shown once on creation and
            stored only as a sha256 hash afterward.
          </p>
        </div>
        <CreateTokenButton />
      </div>

      <div className="mt-12">
        <TokenList tokens={summaries} />
      </div>
    </div>
  );
}

function EmptyShell({ dbConfigured }: { dbConfigured: boolean }) {
  if (!dbConfigured) {
    return (
      <div>
        <p className="mb-3 font-mono text-xs text-muted-foreground">tokens</p>
        <h1 className="text-2xl font-medium tracking-tight text-display sm:text-3xl">
          API tokens.
        </h1>
        <div className="mt-12 rounded border border-dashed border-border px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Database isn't configured yet.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Set <code>MONGODB_URI</code> in <code>.env.local</code> to enable
            token issuance.
          </p>
        </div>
      </div>
    );
  }
  redirect("/login");
}
