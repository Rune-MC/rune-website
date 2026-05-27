import { SiteFooter } from "@/components/marketing/site-footer";
import { RunebookHeader } from "@/components/runebook/runebook-header";
import { currentUser } from "@/lib/auth/server";

export default async function RunebookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await currentUser();
  const userLabel = me?.doc.username
    ? `@${me.doc.username}`
    : (me?.doc.githubLogin ?? null);

  return (
    <>
      <RunebookHeader userLabel={userLabel} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
