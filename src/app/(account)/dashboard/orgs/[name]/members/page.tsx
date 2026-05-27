import { MembersClient } from "./members-client";

export default async function MembersPage({
  params,
}: PageProps<"/dashboard/orgs/[name]">) {
  const { name } = await params;
  return <MembersClient orgName={String(name)} />;
}
