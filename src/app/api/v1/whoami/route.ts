import { Errors, route } from "@/lib/api";
import { connectDb, isDbConfigured } from "@/lib/db";

// Identity probe. Used by the CLI's `rune login` (pre-save token check)
// and `rune whoami` (live-validate the cached token), and by anything
// else that wants to ask "who is this Authorization header?". Accepts
// either a session cookie or a PAT — `auth: "any"`.
//
// Returns the public-ish profile fields plus the auth context (cli vs
// session, and PAT scopes when applicable) so the CLI can render
// something useful without having to make a second call.
export const GET = route({
  auth: "any",
  handler: async ({ auth }) => {
    // Username is optional in the schema, but most user-facing operations
    // assume it's set. Surface a 409 here rather than later so the CLI can
    // tell the user "go finish your profile" with a clear error.
    if (!auth.user.username) {
      if (!isDbConfigured()) throw new Errors.ServiceUnavailable();
      await connectDb();
      throw new Errors.Conflict(
        "Your account doesn't have a username yet. Set one at /onboarding before publishing.",
      );
    }

    return {
      username: auth.user.username,
      display_name: auth.user.displayName ?? null,
      avatar_url: auth.user.avatarUrl ?? null,
      via: auth.via,
      scopes: auth.via === "cli" ? (auth.token?.scopes ?? []) : null,
    };
  },
});
