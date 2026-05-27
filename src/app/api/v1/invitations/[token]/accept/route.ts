import { z } from "zod";
import { Errors, ok, route } from "@/lib/api";
import { connectDb, isDbConfigured } from "@/lib/db";
import { AuditLog } from "@/lib/db/models/audit-log";
import { Org } from "@/lib/db/models/org";
import { OrgInvitation } from "@/lib/db/models/org-invitation";
import { OrgMember } from "@/lib/db/models/org-member";
import { Role } from "@/lib/db/models/role";
import { notify } from "@/lib/notifications/service";

const params = z.object({ token: z.string().min(8) });

export const POST = route({
  auth: "session",
  params,
  handler: async ({ params, auth }) => {
    if (!isDbConfigured()) throw new Errors.ServiceUnavailable();
    await connectDb();

    const invite = await OrgInvitation.findOne({ token: params.token });
    if (!invite) throw new Errors.NotFound("Invitation not found");
    if (invite.status !== "pending") {
      throw new Errors.Gone("Invitation already used");
    }
    if (invite.expiresAt.getTime() < Date.now()) {
      invite.status = "expired";
      await invite.save();
      throw new Errors.Gone("Invitation expired");
    }

    if (auth.user.email?.toLowerCase() !== invite.email.toLowerCase()) {
      throw new Errors.Forbidden(
        "This invitation was sent to a different email address",
      );
    }

    const [org, role] = await Promise.all([
      Org.findById(invite.orgId),
      Role.findById(invite.roleId),
    ]);
    if (!org || !role) {
      throw new Errors.Internal("Invitation context missing");
    }

    const existing = await OrgMember.findOne({
      orgId: org._id,
      userId: auth.user._id,
    });
    if (!existing) {
      await OrgMember.create({
        orgId: org._id,
        userId: auth.user._id,
        roleId: role._id,
        invitedBy: invite.invitedBy,
        joinedAt: new Date(),
      });
    }

    invite.status = "accepted";
    invite.acceptedAt = new Date();
    invite.acceptedBy = auth.user._id;
    await invite.save();

    void notify({
      userId: invite.invitedBy,
      type: "org.member.joined",
      title: `${auth.user.username ?? auth.user.githubLogin} joined ${org.displayName ?? org.name}`,
      body: "They accepted your invitation.",
      href: `/dashboard/orgs/${org.name}/members`,
      data: { orgId: String(org._id), userId: String(auth.user._id) },
      email: false,
    }).catch(() => {});

    void AuditLog.create({
      actorUserId: auth.user._id,
      orgId: org._id,
      action: "org.invitation.accepted",
      data: { token: invite.token, roleKey: role.key },
    }).catch(() => {});

    return ok({
      org: { name: org.name },
      role: { key: role.key, name: role.name },
    });
  },
});
