import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDb, isDbConfigured } from "@/lib/db";
import { User } from "@/lib/db/models/user";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: PageProps<"/admin/users">) {
  if (!isDbConfigured()) notFound();
  await connectDb();

  const sp = await searchParams;
  const q =
    typeof sp.q === "string" ? sp.q.trim() : Array.isArray(sp.q) ? sp.q[0] : "";

  const filter = q
    ? {
        $or: [
          { username: { $regex: q, $options: "i" } },
          { githubLogin: { $regex: q, $options: "i" } },
          { email: { $regex: q, $options: "i" } },
        ],
      }
    : {};

  const users = await User.find(filter)
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-medium tracking-tight text-display">
          Users
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {users.length} shown (max 100). Search by username, GitHub login, or
          email.
        </p>
      </div>

      <form action="/admin/users" method="GET" className="max-w-md">
        <input
          name="q"
          type="search"
          defaultValue={q}
          placeholder="search..."
          className="w-full rounded border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-primary"
        />
      </form>

      <ul className="divide-y divide-border">
        {users.map((u) => (
          <li
            key={String(u._id)}
            className="flex flex-wrap items-baseline justify-between gap-3 py-3"
          >
            <div className="min-w-0">
              <Link
                href={`/admin/users/${u._id}`}
                className="font-mono text-sm text-foreground transition-colors hover:text-primary-hover"
              >
                {u.username ? `@${u.username}` : u.githubLogin}
              </Link>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {u.email ?? "no email"} · gh:{u.githubLogin}
              </p>
            </div>
            <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
              {u.platformRole && (
                <span className="text-primary">{u.platformRole}</span>
              )}
              {u.suspendedAt && (
                <span className="text-destructive">suspended</span>
              )}
              <span>
                {u.createdAt instanceof Date
                  ? u.createdAt.toISOString().slice(0, 10)
                  : ""}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
