import { notFound } from "next/navigation";
import { connectDb, isDbConfigured } from "@/lib/db";
import { AuditLog } from "@/lib/db/models/audit-log";
import { Org } from "@/lib/db/models/org";
import { Rune } from "@/lib/db/models/rune";
import { User } from "@/lib/db/models/user";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  if (!isDbConfigured()) notFound();
  await connectDb();
  const [userCount, runeCount, orgCount, recent] = await Promise.all([
    User.countDocuments({}),
    Rune.countDocuments({}),
    Org.countDocuments({}),
    AuditLog.find({}).sort({ _id: -1 }).limit(25).lean(),
  ]);

  return (
    <div className="space-y-12">
      <section>
        <p className="font-mono text-xs text-muted-foreground">overview</p>
        <h1 className="mt-2 text-2xl font-medium tracking-tight text-display sm:text-3xl">
          Platform admin.
        </h1>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="users" value={userCount.toLocaleString()} />
        <Stat label="runes" value={runeCount.toLocaleString()} />
        <Stat label="orgs" value={orgCount.toLocaleString()} />
      </section>

      <section>
        <h2 className="font-mono text-xs text-muted-foreground">
          recent activity
        </h2>
        {recent.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Nothing yet. Activity from across the platform shows up here.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {recent.map((entry) => (
              <li
                key={String(entry._id)}
                className="flex items-baseline justify-between gap-3 py-3"
              >
                <p className="font-mono text-sm text-foreground">
                  {entry.action}
                </p>
                <span className="font-mono text-xs text-muted-foreground">
                  {entry.createdAt instanceof Date
                    ? entry.createdAt
                        .toISOString()
                        .slice(0, 16)
                        .replace("T", " ")
                    : ""}
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
