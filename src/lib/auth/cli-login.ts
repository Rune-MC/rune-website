import { randomBytes } from "node:crypto";
import { z } from "zod";
import { Errors } from "@/lib/api/errors";
import { connectDb, isDbConfigured } from "@/lib/db";
import { ApiToken } from "@/lib/db/models/api-token";
import { CliLogin } from "@/lib/db/models/cli-login";
import { User } from "@/lib/db/models/user";
import { generatePatToken, sha256, sha256Hex } from "@/lib/hash";

const LOGIN_SECONDS = 600;
const POLL_SECONDS = 5;
const TOKEN_DAYS = 30;
const secret = z.string().regex(/^[A-Za-z0-9_-]{43}$/);

export const cliLoginStart = z.object({
  challenge: secret,
  callback: z
    .object({
      uri: z
        .string()
        .regex(/^http:\/\/127\.0\.0\.1:[1-9]\d{0,4}\/rune\/login$/)
        .refine((value) => URL.canParse(value) && new URL(value).port !== ""),
      state: secret,
    })
    .nullish(),
});

export const cliLoginExchange = z.object({
  deviceCode: secret,
  verifier: secret,
});

export function normalizeUserCode(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 32) return undefined;
  const normalized = value.toUpperCase().replace(/[\s-]/g, "");
  return /^[A-F0-9]{12}$/.test(normalized) ? normalized : undefined;
}

export function cliLoginPath(code?: string): string {
  return code ? `/cli/login?code=${code}` : "/cli/login";
}

export function cliLoginContinuation(path: string): string | undefined {
  const url = new URL(path, "https://runemc.dev");
  if (url.pathname !== "/cli/login") return undefined;
  return cliLoginPath(normalizeUserCode(url.searchParams.get("code")));
}

export async function startCliLogin(
  body: z.infer<typeof cliLoginStart>,
  source: string | null,
) {
  if (!isDbConfigured()) throw new Errors.ServiceUnavailable();
  await connectDb();
  const now = new Date();
  const sourceHash = source ? sha256Hex(source) : undefined;
  if (sourceHash) {
    const recent = await CliLogin.countDocuments({
      sourceHash,
      createdAt: { $gt: new Date(now.getTime() - 60_000) },
    });
    if (recent >= 30)
      throw new Errors.TooManyRequests("Try again in a minute.");
  }
  const deviceCode = randomBytes(32).toString("base64url");
  const userCode = randomBytes(6).toString("hex").toUpperCase();
  await CliLogin.create({
    deviceHash: sha256Hex(deviceCode),
    userCode,
    challenge: body.challenge,
    redirectUri: body.callback?.uri,
    state: body.callback?.state,
    expiresAt: new Date(now.getTime() + LOGIN_SECONDS * 1000),
    nextPollAt: new Date(now.getTime() + POLL_SECONDS * 1000),
    createdAt: now,
    sourceHash,
  });
  return {
    deviceCode,
    userCode,
    expiresIn: LOGIN_SECONDS,
    interval: POLL_SECONDS,
  };
}

export async function exchangeCliLogin(body: z.infer<typeof cliLoginExchange>) {
  if (!isDbConfigured()) throw new Errors.ServiceUnavailable();
  await connectDb();
  const now = new Date();
  const selector = {
    deviceHash: sha256Hex(body.deviceCode),
    challenge: sha256(body.verifier).toString("base64url"),
    expiresAt: { $gt: now },
  };
  const approved = await CliLogin.findOneAndDelete({
    ...selector,
    userId: { $exists: true },
  }).lean();
  if (approved) {
    const user = await User.findById(approved.userId).lean();
    if (!user?.username || user.suspendedAt)
      return { status: "denied" as const };
    const token = generatePatToken();
    await ApiToken.create({
      userId: user._id,
      name: "Rune CLI",
      tokenHash: sha256(token),
      scopes: ["read", "publish"],
      expiresAt: new Date(now.getTime() + TOKEN_DAYS * 86_400_000),
    });
    return { status: "approved" as const, token };
  }

  const pending = await CliLogin.findOneAndUpdate(
    { ...selector, nextPollAt: { $lte: now } },
    { $set: { nextPollAt: new Date(now.getTime() + POLL_SECONDS * 1000) } },
  ).lean();
  if (pending) return { status: "pending" as const };
  if (await CliLogin.exists(selector)) return { status: "slow_down" as const };
  return { status: "expired" as const };
}
