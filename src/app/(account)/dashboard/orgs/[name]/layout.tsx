import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/server";
import { connectDb, isDbConfigured } from "@/lib/db";
import { Org } from "@/lib/db/models/org";
import { OrgMember } from "@/lib/db/models/org-member";
import { Role } from "@/lib/db/models/role";
import { OrgSubnav } from "./subnav";

export default async function OrgLayout({
  children,
  params,
}: LayoutProps<"/dashboard/orgs/[name]">) {
  const me = await currentUser();
  if (!me) redirect("/login");
  if (!isDbConfigured()) notFound();
  await connectDb();
  const { name } = await params;

  const org = await Org.findOne({ name: String(name).toLowerCase() }).lean();
  if (!org) notFound();

  const membership = await OrgMember.findOne({
    orgId: org._id,
    userId: me.doc._id,
  }).lean();
  if (!membership && me.doc.platformRole !== "owner") notFound();

  const role = membership
    ? await Role.findById(membership.roleId).lean()
    : null;

  return (
    <div>
      <div className="mb-8">
        <p className="mb-2 font-mono text-xs text-muted-foreground">
          <Link
            href="/dashboard/orgs"
            className="transition-colors hover:text-foreground"
          >
            orgs
          </Link>
          {" · "}@{org.name}
        </p>
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h1 className="font-mono text-2xl text-display sm:text-3xl">
            {org.displayName ?? org.name}
          </h1>
          <span className="font-mono text-xs text-muted-foreground">
            {role?.name ?? "—"}
          </span>
        </div>
        {org.description && (
          <p className="mt-2 max-w-prose text-sm text-muted-foreground">
            {org.description}
          </p>
        )}
      </div>
      <OrgSubnav name={org.name} />
      <div className="pt-8">{children}</div>
    </div>
  );
}
