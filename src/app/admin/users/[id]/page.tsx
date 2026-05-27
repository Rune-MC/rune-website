import { notFound } from "next/navigation";
import { currentUser } from "@/lib/auth/server";
import { connectDb, isDbConfigured } from "@/lib/db";
import { User } from "@/lib/db/models/user";
import { UserAdminActions } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminUserDetail({
  params,
}: PageProps<"/admin/users/[id]">) {
  if (!isDbConfigured()) notFound();
  await connectDb();
  const me = await currentUser();
  const { id } = await params;

  const user = await User.findById(String(id)).lean();
  if (!user) notFound();

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-xs text-muted-foreground">user</p>
        <h1 className="mt-1 font-mono text-2xl text-display">
          {user.username ? `@${user.username}` : user.githubLogin}
        </h1>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <Row label="github" value={`@${user.githubLogin}`} />
        <Row label="email" value={user.email ?? "—"} />
        <Row label="role" value={user.platformRole ?? "regular user"} />
        <Row label="status" value={user.suspendedAt ? "suspended" : "active"} />
        <Row
          label="created"
          value={
            user.createdAt instanceof Date
              ? user.createdAt.toISOString().slice(0, 10)
              : "—"
          }
        />
      </dl>

      {me?.doc.platformRole === "owner" && (
        <UserAdminActions
          userId={String(user._id)}
          suspended={Boolean(user.suspendedAt)}
          platformRole={user.platformRole ?? null}
        />
      )}
    </div>
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
