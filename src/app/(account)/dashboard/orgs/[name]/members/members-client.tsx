"use client";

import { type FormEvent, useState } from "react";
import { ApiError } from "@/lib/api/client";
import {
  useChangeMemberRoleMutation,
  useInviteMemberMutation,
  useOrgMembersQuery,
  useOrgRolesQuery,
  useRemoveMemberMutation,
} from "@/lib/query/orgs";

interface Props {
  orgName: string;
}

export function MembersClient({ orgName }: Props) {
  const members = useOrgMembersQuery(orgName);
  const roles = useOrgRolesQuery(orgName);
  const invite = useInviteMemberMutation(orgName);
  const remove = useRemoveMemberMutation(orgName);
  const changeRole = useChangeMemberRoleMutation(orgName);

  const [email, setEmail] = useState("");
  const [roleKey, setRoleKey] = useState("member");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    try {
      await invite.mutateAsync({ email: email.trim().toLowerCase(), roleKey });
      setEmail("");
      setNotice(`Invitation sent to ${email.trim()}.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to invite");
    }
  };

  const handleRemove = async (userId: string, label: string) => {
    if (!confirm(`Remove ${label} from the org?`)) return;
    try {
      await remove.mutateAsync(userId);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to remove");
    }
  };

  const handleRoleChange = async (userId: string, nextRole: string) => {
    try {
      await changeRole.mutateAsync({ userId, roleKey: nextRole });
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to change role");
    }
  };

  return (
    <div className="space-y-12">
      <section>
        <h2 className="font-mono text-xs text-muted-foreground">invite</h2>
        <form onSubmit={submit} className="mt-3 flex flex-wrap items-end gap-3">
          <label className="flex-1 min-w-[16rem]">
            <span className="block text-xs text-muted-foreground">email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="block text-xs text-muted-foreground">role</span>
            <select
              value={roleKey}
              onChange={(e) => setRoleKey(e.target.value)}
              className="mt-1 rounded border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-primary"
            >
              {roles.data?.roles
                .filter((r) => r.key !== "owner")
                .map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.name}
                  </option>
                ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={invite.isPending}
            className="rounded border border-border bg-foreground px-4 py-2 font-mono text-xs text-background transition-colors hover:bg-display disabled:opacity-50"
          >
            {invite.isPending ? "sending..." : "send invite"}
          </button>
        </form>
        {error && (
          <p className="mt-2 font-mono text-xs text-destructive">{error}</p>
        )}
        {notice && (
          <p className="mt-2 font-mono text-xs text-primary">{notice}</p>
        )}
      </section>

      <section>
        <h2 className="font-mono text-xs text-muted-foreground">members</h2>
        {members.isLoading ? (
          <p className="mt-4 font-mono text-sm text-muted-foreground">
            loading...
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {members.data?.members.map((m) => (
              <li
                key={m.user_id}
                className="flex flex-wrap items-baseline justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="font-mono text-sm text-foreground">
                    {m.username ? `@${m.username}` : (m.github_login ?? "—")}
                  </p>
                  {m.display_name && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {m.display_name}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {m.is_owner ? (
                    <span className="font-mono text-xs text-primary">
                      owner
                    </span>
                  ) : (
                    <select
                      value={m.role_key ?? ""}
                      onChange={(e) =>
                        handleRoleChange(m.user_id, e.target.value)
                      }
                      className="rounded border border-border bg-background px-2 py-1 font-mono text-xs outline-none focus:border-primary"
                    >
                      {roles.data?.roles.map((r) => (
                        <option key={r.key} value={r.key}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {!m.is_owner && (
                    <button
                      type="button"
                      onClick={() =>
                        handleRemove(
                          m.user_id,
                          m.username
                            ? `@${m.username}`
                            : (m.github_login ?? ""),
                        )
                      }
                      className="font-mono text-xs text-muted-foreground transition-colors hover:text-destructive"
                    >
                      remove
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {members.data?.pending_invitations &&
        members.data.pending_invitations.length > 0 && (
          <section>
            <h2 className="font-mono text-xs text-muted-foreground">
              pending invitations
            </h2>
            <ul className="mt-4 divide-y divide-border">
              {members.data.pending_invitations.map((i) => (
                <li
                  key={i.id}
                  className="flex items-baseline justify-between gap-3 py-3"
                >
                  <p className="font-mono text-sm text-foreground">{i.email}</p>
                  <span className="font-mono text-xs text-muted-foreground">
                    {i.role_key} · expires{" "}
                    {new Date(i.expires_at).toISOString().slice(0, 10)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
    </div>
  );
}
