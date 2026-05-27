import { notFound } from "next/navigation";
import { connectDb, isDbConfigured } from "@/lib/db";
import { Org } from "@/lib/db/models/org";
import { ensureSystemRoles } from "@/lib/rbac/seed";
import { RolesClient } from "./roles-client";

export const dynamic = "force-dynamic";

export default async function OrgRolesPage({
  params,
}: PageProps<"/dashboard/orgs/[name]">) {
  if (!isDbConfigured()) notFound();
  await connectDb();
  await ensureSystemRoles();
  const { name } = await params;
  const org = await Org.findOne({ name: String(name).toLowerCase() }).lean();
  if (!org) notFound();

  return <RolesClient orgName={org.name} />;
}
