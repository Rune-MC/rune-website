import { notFound } from "next/navigation";
import { connectDb, isDbConfigured } from "@/lib/db";
import { Org } from "@/lib/db/models/org";
import { OrgMember } from "@/lib/db/models/org-member";

export const dynamic = "force-dynamic";

export default async function AdminOrgsPage() {
  if (!isDbConfigured()) notFound();
  await connectDb();
  const orgs = await Org.find({}).sort({ createdAt: -1 }).limit(100).lean();
  const counts = await Promise.all(
    orgs.map((o) => OrgMember.countDocuments({ orgId: o._id })),
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-medium tracking-tight text-display">
          Organizations
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {orgs.length} shown (max 100).
        </p>
      </div>

      <ul className="divide-y divide-border">
        {orgs.map((o, i) => (
          <li
            key={String(o._id)}
            className="flex flex-wrap items-baseline justify-between gap-3 py-3"
          >
            <div className="min-w-0">
              <p className="font-mono text-sm text-foreground">@{o.name}</p>
              {o.description && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {o.description}
                </p>
              )}
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              {counts[i]} member{counts[i] === 1 ? "" : "s"}
              {o.suspendedAt && (
                <span className="ml-2 text-destructive">suspended</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
