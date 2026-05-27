import { notFound } from "next/navigation";
import { connectDb, isDbConfigured } from "@/lib/db";
import { Org } from "@/lib/db/models/org";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function OrgSettingsPage({
  params,
}: PageProps<"/dashboard/orgs/[name]">) {
  if (!isDbConfigured()) notFound();
  await connectDb();
  const { name } = await params;
  const org = await Org.findOne({ name: String(name).toLowerCase() }).lean();
  if (!org) notFound();

  return (
    <SettingsForm
      orgName={org.name}
      initial={{
        displayName: org.displayName ?? org.name,
        description: org.description ?? "",
        homepage: org.homepage ?? "",
      }}
    />
  );
}
