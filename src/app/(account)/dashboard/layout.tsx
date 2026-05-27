import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { UserMenu } from "@/components/dashboard/user-menu";
import { currentLocksmithUser, currentUser } from "@/lib/auth/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locksmith = await currentLocksmithUser();
  if (!locksmith) redirect("/login");

  // Bridged doc is null when MONGODB_URI isn't configured; fall back to email.
  const bridged = await currentUser();
  const userLabel = bridged?.doc.username
    ? `@${bridged.doc.username}`
    : (locksmith.email ?? "user");

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
