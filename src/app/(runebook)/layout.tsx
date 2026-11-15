import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
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
      <SiteHeader />
      <RunebookHeader userLabel={userLabel} />
      <main id="main-content" tabIndex={-1} className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
