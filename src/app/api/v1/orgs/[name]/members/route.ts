import { randomBytes } from "node:crypto";
import { z } from "zod";
import { created, Errors, ok, route } from "@/lib/api";
import { connectDb, isDbConfigured } from "@/lib/db";
import { AuditLog } from "@/lib/db/models/audit-log";
import { Org } from "@/lib/db/models/org";
import { OrgInvitation } from "@/lib/db/models/org-invitation";
import { OrgMember } from "@/lib/db/models/org-member";
import { Role } from "@/lib/db/models/role";
import { User } from "@/lib/db/models/user";
import { siteOrigin } from "@/lib/email/client";
import { sendEmail } from "@/lib/email/send";
import { orgInviteEmail } from "@/lib/email/templates";
import { notify } from "@/lib/notifications/service";
import { ORG_PERMISSIONS } from "@/lib/rbac/permissions";
import { requirePermission } from "@/lib/rbac/resolver";

const params = z.object({ name: z.string() });

const inviteBody = z.object({
  email: z.string().email().toLowerCase(),
  roleKey: z.string().min(1).max(48),
});

const INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export const GET = route({
  auth: "session",
  params,
  handler: async ({ params, auth }) => {
    if (!isDbConfigured()) throw new Errors.ServiceUnavailable();
    await connectDb();
    const org = await Org.findOne({ name: params.name.toLowerCase() });
    if (!org) throw new Errors.NotFound("Org not found");
    await requirePermission(auth.user, ORG_PERMISSIONS.MEMBERS_READ, {
      orgId: org._id,
    });

    const members = await OrgMember.find({ orgId: org._id }).lean();
    const userIds = members.map((m) => m.userId);
    const roleIds = members.map((m) => m.roleId);
    const [users, roles] = await Promise.all([
      User.find({ _id: { $in: userIds } })
        .select({ username: 1, githubLogin: 1, displayName: 1, avatarUrl: 1 })
        .lean(),
      Role.find({ _id: { $in: roleIds } })
        .select({ key: 1, name: 1 })
        .lean(),
    ]);
    const usersById = new Map(users.map((u) => [String(u._id), u]));
    const rolesById = new Map(roles.map((r) => [String(r._id), r]));

    const pendingInvites = await OrgInvitation.find({
      orgId: org._id,
      status: "pending",
      expiresAt: { $gt: new Date() },
    }).lean();
    const inviteRoles = await Role.find({
      _id: { $in: pendingInvites.map((i) => i.roleId) },
    }).lean();
    const inviteRolesById = new Map(inviteRoles.map((r) => [String(r._id), r]));

    return ok({
      members: members.map((m) => {
        const u = usersById.get(String(m.userId));
        const r = rolesById.get(String(m.roleId));
        return {
          user_id: String(m.userId),
          username: u?.username ?? null,
          github_login: u?.githubLogin ?? null,
          display_name: u?.displayName ?? null,
          avatar_url: u?.avatarUrl ?? null,
          role_key: r?.key ?? null,
          role_name: r?.name ?? null,
          is_owner: String(org.ownerId) === String(m.userId),
          joined_at:
            m.joinedAt instanceof Date ? m.joinedAt.toISOString() : null,
        };
      }),
      pending_invitations: pendingInvites.map((i) => ({
        id: String(i._id),
        email: i.email,
        role_key: inviteRolesById.get(String(i.roleId))?.key ?? null,
        invited_at:
          i.createdAt instanceof Date ? i.createdAt.toISOString() : null,
        expires_at: i.expiresAt.toISOString(),
      })),
    });
  },
});

export const POST = route({
  auth: "session",
  params,
  body: inviteBody,
  handler: async ({ params, body, auth }) => {
    if (!isDbConfigured()) throw new Errors.ServiceUnavailable();
    await connectDb();
    const org = await Org.findOne({ name: params.name.toLowerCase() });
    if (!org) throw new Errors.NotFound("Org not found");
    await requirePermission(auth.user, ORG_PERMISSIONS.MEMBERS_INVITE, {
      orgId: org._id,
    });

    const role = await Role.findOne({
      key: body.roleKey,
      $or: [{ orgId: null, isSystem: true }, { orgId: org._id }],
    });
    if (!role) throw new Errors.BadRequest(`Unknown role: ${body.roleKey}`);

    // If the email belongs to an existing user already in the org, skip.
    const existingUser = await User.findOne({ email: body.email });
    if (existingUser) {
      const alreadyMember = await OrgMember.findOne({
        orgId: org._id,
        userId: existingUser._id,
      });
      if (alreadyMember) {
        throw new Errors.Conflict("User is already a member");
      }
    }

    const token = randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

    const invitation = await OrgInvitation.create({
      orgId: org._id,
      email: body.email,
      roleId: role._id,
      invitedBy: auth.user._id,
      token,
      expiresAt,
      status: "pending",
    });

    const origin = siteOrigin();
    const inviteUrl = `${origin}/invitations/${token}`;
    const inviterName =
      auth.user.displayName ?? auth.user.username ?? auth.user.githubLogin;

    const tpl = orgInviteEmail({
      origin,
      orgName: org.name,
      orgDisplayName: org.displayName ?? org.name,
      inviterName,
      roleName: role.name,
      inviteUrl,
    });
    void sendEmail({
      to: body.email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    }).catch(() => {});

    // If they already have an account, also drop an in-app notification.
    if (existingUser) {
      void notify({
        userId: existingUser._id,
        type: "org.invited",
        title: `Invitation to join ${org.displayName ?? org.name}`,
        body: `${inviterName} invited you as a ${role.name}.`,
        href: `/invitations/${token}`,
        data: { orgId: String(org._id), token, roleKey: role.key },
        email: false, // already emailed above
      }).catch(() => {});
    }

    void AuditLog.create({
      actorUserId: auth.user._id,
      orgId: org._id,
      action: "org.invitation.sent",
      data: { email: body.email, roleKey: role.key },
    }).catch(() => {});

    return created({
      id: String(invitation._id),
      token,
      expires_at: expiresAt.toISOString(),
    });
  },
});
