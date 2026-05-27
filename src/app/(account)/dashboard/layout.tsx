import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { UserMenu } from "@/components/dashboard/user-menu";
import { currentUser } from "@/lib/auth/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await currentUser();
  if (!me) redirect("/login?next=/dashboard");

  const userLabel = me.doc.username
    ? `@${me.doc.username}`
    : (me.doc.email ?? me.doc.githubLogin);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 pt-8 pb-16 sm:pt-10 sm:pb-24">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <DashboardNav />
        <UserMenu label={userLabel} />
      </div>
      <div className="pt-10 sm:pt-12">{children}</div>
    </div>
  );
}
