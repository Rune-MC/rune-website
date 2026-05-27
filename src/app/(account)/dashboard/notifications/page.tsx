import type { Metadata } from "next";
import { NotificationsClient } from "./notifications-client";

export const metadata: Metadata = {
  title: "Notifications",
};

export default function NotificationsPage() {
  return (
    <div>
      <p className="mb-3 font-mono text-xs text-muted-foreground">
        notifications
      </p>
      <h1 className="text-2xl font-medium tracking-tight text-display sm:text-3xl">
        Notifications.
      </h1>
      <p className="mt-3 max-w-prose text-sm text-foreground">
        Invitations, role changes, and platform notices. Mirrors of these are
        also sent to your email when configured.
      </p>
      <div className="mt-10">
        <NotificationsClient />
      </div>
    </div>
  );
}
