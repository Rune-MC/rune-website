import { type NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForToken,
  fetchGithubProfile,
  isGithubConfigured,
} from "@/lib/auth/github";
import {
  OAUTH_REDIRECT_COOKIE,
  OAUTH_STATE_COOKIE,
  setSessionCookie,
} from "@/lib/auth/session";
import { connectDb, isDbConfigured } from "@/lib/db";
import { User } from "@/lib/db/models/user";

function failureRedirect(origin: string, reason: string): NextResponse {
  const url = new URL("/login", origin);
  url.searchParams.set("error", reason);
  const res = NextResponse.redirect(url);
  res.cookies.delete(OAUTH_STATE_COOKIE);
  res.cookies.delete(OAUTH_REDIRECT_COOKIE);
  return res;
}

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  if (!isGithubConfigured() || !isDbConfigured()) {
    return failureRedirect(origin, "unconfigured");
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");
  if (error) return failureRedirect(origin, error);
  if (!code || !state) return failureRedirect(origin, "missing_params");

  const storedState = req.cookies.get(OAUTH_STATE_COOKIE)?.value;
  if (!storedState || storedState !== state) {
    return failureRedirect(origin, "state_mismatch");
  }
  const redirectTarget =
    req.cookies.get(OAUTH_REDIRECT_COOKIE)?.value ?? "/dashboard";

  let profile: Awaited<ReturnType<typeof fetchGithubProfile>>;
  try {
    const redirectUri = new URL("/api/auth/github/callback", origin).toString();
    const accessToken = await exchangeCodeForToken({ code, redirectUri });
    profile = await fetchGithubProfile(accessToken);
  } catch {
    return failureRedirect(origin, "github_exchange_failed");
  }

  await connectDb();
  const doc = await User.findOneAndUpdate(
    { githubId: profile.id },
    {
      $set: {
        githubLogin: profile.login,
        ...(profile.email ? { email: profile.email } : {}),
        ...(profile.name ? { displayName: profile.name } : {}),
        ...(profile.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
      },
      $setOnInsert: { githubId: profile.id },
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
  if (!doc) return failureRedirect(origin, "user_upsert_failed");

  // Send new users (without a username) through the welcome screen.
  const finalTarget = doc.username ? redirectTarget : "/dashboard/welcome";

  const res = NextResponse.redirect(new URL(finalTarget, origin));
  res.cookies.delete(OAUTH_STATE_COOKIE);
  res.cookies.delete(OAUTH_REDIRECT_COOKIE);
  await setSessionCookie(res, {
    sub: String(doc._id),
    gh: profile.id,
  });
  return res;
}
