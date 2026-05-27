import { z } from "zod";
import { Errors, ok, route } from "@/lib/api";
import { connectDb, isDbConfigured } from "@/lib/db";
import { Org } from "@/lib/db/models/org";
import { OrgInvitation } from "@/lib/db/models/org-invitation";
import { Role } from "@/lib/db/models/role";
import { User } from "@/lib/db/models/user";

const params = z.object({ token: z.string().min(8) });

export const GET = route({
  auth: "optional",
  params,
  handler: async ({ params, auth }) => {
    if (!isDbConfigured()) throw new Errors.ServiceUnavailable();
    await connectDb();
    const invite = await OrgInvitation.findOne({ token: params.token });
    if (!invite) throw new Errors.NotFound("Invitation not found");

    const [org, role, inviter] = await Promise.all([
      Org.findById(invite.orgId).lean(),
      Role.findById(invite.roleId).lean(),
      User.findById(invite.invitedBy)
        .select({ username: 1, githubLogin: 1, displayName: 1 })
        .lean(),
    ]);
    if (!org || !role) throw new Errors.NotFound("Invitation context missing");

    const expired = invite.expiresAt.getTime() < Date.now();
    const status =
      expired && invite.status === "pending" ? "expired" : invite.status;

    // Determine if the current user matches (by email).
    const matchesCurrentUser =
      auth?.user.email?.toLowerCase() === invite.email.toLowerCase();

    return ok({
      status,
      email: invite.email,
      org: {
        name: org.name,
        display_name: org.displayName ?? org.name,
        description: org.description ?? null,
        avatar_url: org.avatarUrl ?? null,
      },
      role: { key: role.key, name: role.name },
      inviter: {
        username: inviter?.username ?? null,
        github_login: inviter?.githubLogin ?? null,
        display_name: inviter?.displayName ?? null,
      },
      expires_at: invite.expiresAt.toISOString(),
      matches_current_user: matchesCurrentUser,
      signed_in: Boolean(auth),
    });
  },
});
