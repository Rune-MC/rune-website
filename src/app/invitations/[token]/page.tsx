import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { currentUser } from "@/lib/auth/server";
import { connectDb, isDbConfigured } from "@/lib/db";
import { Org } from "@/lib/db/models/org";
import { OrgInvitation } from "@/lib/db/models/org-invitation";
import { Role } from "@/lib/db/models/role";
import { User } from "@/lib/db/models/user";
import { AcceptInvitationCard } from "./accept-card";

export const metadata: Metadata = {
  title: "Invitation",
  robots: { index: false, follow: false },
};

export default async function InvitationPage({
  params,
}: PageProps<"/invitations/[token]">) {
  if (!isDbConfigured()) notFound();
  await connectDb();
  const { token } = await params;

  const invite = await OrgInvitation.findOne({ token: String(token) }).lean();
  if (!invite) notFound();

  const [org, role, inviter, me] = await Promise.all([
    Org.findById(invite.orgId).lean(),
    Role.findById(invite.roleId).lean(),
    User.findById(invite.invitedBy)
      .select({ username: 1, githubLogin: 1, displayName: 1 })
      .lean(),
    currentUser(),
  ]);
  if (!org || !role) notFound();

  const expired = invite.expiresAt.getTime() < Date.now();
  const effectiveStatus =
    expired && invite.status === "pending" ? "expired" : invite.status;

  const inviterLabel =
    inviter?.displayName ?? inviter?.username ?? inviter?.githubLogin ?? "";

  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col justify-center px-6 py-16">
      <p className="mb-3 font-mono text-xs text-muted-foreground">invitation</p>
      <h1 className="text-2xl font-medium tracking-tight text-display sm:text-3xl">
        Join {org.displayName ?? org.name}.
      </h1>
      <p className="mt-3 text-sm text-foreground">
        <strong>{inviterLabel}</strong> invited <code>{invite.email}</code> to{" "}
        <code>@{org.name}</code> as a <strong>{role.name}</strong>.
      </p>

      <AcceptInvitationCard
        token={String(token)}
        status={effectiveStatus}
        inviteEmail={invite.email}
        signedIn={Boolean(me)}
        userEmail={me?.doc.email ?? null}
        orgName={org.name}
      />

      <p className="mt-6 font-mono text-xs text-muted-foreground">
        Expires {invite.expiresAt.toISOString().slice(0, 10)}.
      </p>
    </div>
  );
}
