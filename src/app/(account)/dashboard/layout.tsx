import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { UserMenu } from "@/components/dashboard/user-menu";
import { currentUser } from "@/lib/auth/server";
import { connectDb, isDbConfigured } from "@/lib/db";
import { Notification } from "@/lib/db/models/notification";

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

  let unreadCount = 0;
  if (isDbConfigured()) {
    await connectDb();
    unreadCount = await Notification.countDocuments({
      userId: me.doc._id,
      readAt: null,
    });
  }

  const isPlatformStaff = Boolean(me.doc.platformRole);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 pt-8 pb-16 sm:pt-10 sm:pb-24">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <DashboardNav isPlatformStaff={isPlatformStaff} />
        <div className="flex items-center gap-4">
          <NotificationBell unreadCount={unreadCount} />
          <UserMenu label={userLabel} />
        </div>
      </div>
      <div className="pt-10 sm:pt-12">{children}</div>
    </div>
  );
}
