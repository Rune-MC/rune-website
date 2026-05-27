import { jwtVerify, SignJWT } from "jose";

const JWT_ALG = "HS256";
const JWT_ISSUER = "rune-website";
const JWT_AUDIENCE = "rune-session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export const SESSION_TTL_MS = SESSION_TTL_SECONDS * 1000;

export interface SessionClaims {
  /** Mongo user `_id` as a hex string. */
  sub: string;
  /** GitHub numeric id, included so we don't need a DB hit for trivial checks. */
  gh: number;
}

let cachedKey: Uint8Array | null = null;

function getKey(): Uint8Array {
  if (cachedKey) return cachedKey;
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET not configured");
  if (secret.length < 32) {
    throw new Error("AUTH_SECRET must be at least 32 characters");
  }
  cachedKey = new TextEncoder().encode(secret);
  return cachedKey;
}

export function isAuthConfigured(): boolean {
  return Boolean(process.env.AUTH_SECRET);
}

export async function signSession(claims: SessionClaims): Promise<string> {
  return new SignJWT({ gh: claims.gh })
    .setProtectedHeader({ alg: JWT_ALG })
    .setSubject(claims.sub)
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getKey());
}

export async function verifySession(
  token: string,
): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getKey(), {
      algorithms: [JWT_ALG],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    if (typeof payload.sub !== "string") return null;
    if (typeof payload.gh !== "number") return null;
    return { sub: payload.sub, gh: payload.gh };
  } catch {
    return null;
  }
}
