import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import {
  SESSION_TTL_MS,
  type SessionClaims,
  signSession,
  verifySession,
} from "./jwt";

export const SESSION_COOKIE = "rune_session";
export const OAUTH_STATE_COOKIE = "rune_oauth_state";
export const OAUTH_REDIRECT_COOKIE = "rune_oauth_redirect";

const isProd = process.env.NODE_ENV === "production";

interface SessionCookieOptions {
  maxAgeMs?: number;
}

function sessionCookieBase() {
  return {
    name: SESSION_COOKIE,
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
  };
}

/**
 * Mint a fresh session JWT and attach it to the response. Used at the end of
 * the OAuth callback once we've upserted the User doc.
 */
export async function setSessionCookie(
  res: NextResponse,
  claims: SessionClaims,
  opts: SessionCookieOptions = {},
): Promise<void> {
  const token = await signSession(claims);
  res.cookies.set({
    ...sessionCookieBase(),
    value: token,
    maxAge: Math.floor((opts.maxAgeMs ?? SESSION_TTL_MS) / 1000),
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set({
    ...sessionCookieBase(),
    value: "",
    maxAge: 0,
  });
}

/**
 * Read + verify the session JWT from the incoming request cookies. Returns
 * the decoded claims, or `null` when there's no session or the JWT is invalid.
 */
export async function readSession(): Promise<SessionClaims | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}
