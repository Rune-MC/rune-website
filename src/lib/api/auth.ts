import type { NextRequest } from "next/server";
import { currentUser } from "@/lib/auth/server";
import { connectDb, isDbConfigured } from "@/lib/db";
import {
  ApiToken,
  type ApiTokenDoc,
  type ApiTokenScope,
} from "@/lib/db/models/api-token";
import { User, type UserDoc } from "@/lib/db/models/user";
import { sha256 } from "@/lib/hash";
import { Errors } from "./errors";

export type AuthMode = "session" | "cli" | "any" | "optional";

export interface AuthContext {
  /** The Rune `User` doc (bridged from the Locksmith session or PAT). */
  user: UserDoc;
  /** Whether the request came from the browser session or the CLI. */
  via: "session" | "cli";
  /** Only present when `via === "cli"`. */
  token?: { id: string; scopes: ApiTokenScope[] };
}

/**
 * Resolves the request's auth based on the route's required mode.
 * Returns `null` only when `mode === "optional"` and no auth was supplied.
 * Throws `Errors.Unauthorized` when auth is required and missing.
 */
export async function resolveAuth(
  req: NextRequest,
  mode: AuthMode,
): Promise<AuthContext | null> {
  if (mode === "cli") {
    const cli = await resolveCli(req);
    if (!cli) throw new Errors.Unauthorized("Missing or invalid bearer token");
    return cli;
  }

  if (mode === "session") {
    const session = await resolveSession();
    if (!session) throw new Errors.Unauthorized("Session required");
    return session;
  }

  // any | optional: try CLI first (cheaper, no DB if no header), then session
  const cli = await resolveCli(req);
  if (cli) return cli;

  const session = await resolveSession();
  if (session) return session;

  if (mode === "optional") return null;
  throw new Errors.Unauthorized();
}

async function resolveSession(): Promise<AuthContext | null> {
  const bridged = await currentUser();
  if (!bridged) return null;
  return { user: bridged.doc, via: "session" };
}

async function resolveCli(req: NextRequest): Promise<AuthContext | null> {
  const header = req.headers.get("authorization");
  if (!header) return null;
  if (!header.startsWith("Bearer ")) return null;
  const raw = header.slice("Bearer ".length).trim();
  if (!raw.startsWith("rune_pat_")) return null;
  if (!isDbConfigured()) return null;

  await connectDb();
  const tokenHash = sha256(raw);
  const token = (await ApiToken.findOne({
    tokenHash,
  })) as ApiTokenDoc | null;
  if (!token || token.revokedAt) return null;

  const userDoc = await User.findById(token.userId);
  if (!userDoc) return null;

  // Fire-and-forget bump of lastUsedAt; failures don't block the request.
  void ApiToken.updateOne(
    { _id: token._id },
    { $set: { lastUsedAt: new Date() } },
  ).catch(() => {
    /* swallow */
  });

  return {
    user: userDoc,
    via: "cli",
    token: {
      id: String(token._id),
      scopes: token.scopes as ApiTokenScope[],
    },
  };
}

/**
 * Throws `Errors.Forbidden` when the CLI token doesn't have one of the
 * required scopes. No-op when the auth came from a browser session
 * (sessions have full scope by definition).
 */
export function requireScope(auth: AuthContext, scope: ApiTokenScope): void {
  if (auth.via === "session") return;
  if (!auth.token) throw new Errors.Forbidden("Token missing scope");
  if (!auth.token.scopes.includes(scope)) {
    throw new Errors.Forbidden(`Missing scope: ${scope}`);
  }
}
