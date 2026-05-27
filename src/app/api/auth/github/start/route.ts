import { randomBytes } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { buildAuthorizeUrl, isGithubConfigured } from "@/lib/auth/github";
import { OAUTH_REDIRECT_COOKIE, OAUTH_STATE_COOKIE } from "@/lib/auth/session";

const STATE_TTL_SECONDS = 60 * 10; // 10 min
const isProd = process.env.NODE_ENV === "production";

/** Same-origin only — protects against open-redirect to an external site. */
function safeRedirect(next: string | null): string {
  if (!next) return "/dashboard";
  if (!next.startsWith("/")) return "/dashboard";
  if (next.startsWith("//")) return "/dashboard";
  return next;
}

export function GET(req: NextRequest) {
  if (!isGithubConfigured()) {
    return NextResponse.json(
      { error: "GitHub OAuth not configured" },
      { status: 503 },
    );
  }

  const state = randomBytes(24).toString("hex");
  const next = safeRedirect(req.nextUrl.searchParams.get("next"));
  const redirectUri = new URL(
    "/api/auth/github/callback",
    req.nextUrl.origin,
  ).toString();

  const authorizeUrl = buildAuthorizeUrl({ redirectUri, state });
  const res = NextResponse.redirect(authorizeUrl);

  const cookieBase = {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: STATE_TTL_SECONDS,
  };
  res.cookies.set({ ...cookieBase, name: OAUTH_STATE_COOKIE, value: state });
  res.cookies.set({ ...cookieBase, name: OAUTH_REDIRECT_COOKIE, value: next });
  return res;
}
