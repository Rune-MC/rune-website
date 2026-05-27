"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError, apiFetch } from "@/lib/api/client";

interface Props {
  token: string;
  status: string;
  inviteEmail: string;
  signedIn: boolean;
  userEmail: string | null;
  orgName: string;
}

export function AcceptInvitationCard({
  token,
  status,
  inviteEmail,
  signedIn,
  userEmail,
  orgName,
}: Props) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "accepted") {
    return (
      <div className="mt-8 rounded border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
        This invitation has already been accepted.
      </div>
    );
  }
  if (status === "expired" || status === "revoked" || status === "declined") {
    return (
      <div className="mt-8 rounded border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        This invitation is no longer valid ({status}). Ask the inviter for a new
        one.
      </div>
    );
  }

  if (!signedIn) {
    const next = `/invitations/${token}`;
    return (
      <div className="mt-8 space-y-4">
        <p className="text-sm text-muted-foreground">
          Sign in with GitHub to accept. Make sure the GitHub account you sign
          in with has <code>{inviteEmail}</code> as its primary verified email.
        </p>
        <a
          href={`/api/auth/github/start?next=${encodeURIComponent(next)}`}
          className="inline-flex w-full items-center justify-center gap-3 rounded border border-border bg-foreground px-5 py-3 font-mono text-sm text-background transition-colors hover:bg-display"
        >
          Continue with GitHub
        </a>
      </div>
    );
  }

  const emailMatches = userEmail?.toLowerCase() === inviteEmail.toLowerCase();

  if (!emailMatches) {
    return (
      <div className="mt-8 rounded border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        This invitation was sent to <code>{inviteEmail}</code>, but you're
        signed in as <code>{userEmail ?? "unknown"}</code>. Sign out and sign
        back in with a GitHub account whose primary email matches.
      </div>
    );
  }

  const accept = async () => {
    setError(null);
    setAccepting(true);
    try {
      await apiFetch(`/api/v1/invitations/${token}/accept`, {
        method: "POST",
      });
      router.push(`/dashboard/orgs/${orgName}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to accept");
      setAccepting(false);
    }
  };

  return (
    <div className="mt-8 space-y-3">
      <button
        type="button"
        onClick={accept}
        disabled={accepting}
        className="inline-flex w-full items-center justify-center gap-3 rounded border border-border bg-foreground px-5 py-3 font-mono text-sm text-background transition-colors hover:bg-display disabled:opacity-50"
      >
        {accepting ? "accepting..." : "Accept invitation"}
      </button>
      {error && <p className="font-mono text-xs text-destructive">{error}</p>}
    </div>
  );
}
