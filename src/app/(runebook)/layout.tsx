import { SiteFooter } from "@/components/marketing/site-footer";
import { RunebookHeader } from "@/components/runebook/runebook-header";
import { currentLocksmithUser, currentUser } from "@/lib/auth/server";

export default async function RunebookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locksmith = await currentLocksmithUser();
  const bridged = await currentUser();
  const username = bridged?.doc.username ?? null;
  const userLabel = username ? `@${username}` : (locksmith?.email ?? null);

  return (
    <>
      <RunebookHeader userLabel={userLabel} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
