import { z } from "zod";
import { created, Errors, route } from "@/lib/api";
import { connectDb, isDbConfigured } from "@/lib/db";
import { API_TOKEN_SCOPES, ApiToken } from "@/lib/db/models/api-token";
import { generatePatToken, sha256 } from "@/lib/hash";

const createBody = z.object({
  name: z.string().trim().min(1).max(100),
  scopes: z.array(z.enum(API_TOKEN_SCOPES)).min(1).optional(),
});

export const GET = route({
  auth: "session",
  handler: async ({ auth }) => {
    if (!isDbConfigured()) throw new Errors.ServiceUnavailable();
    await connectDb();
    const tokens = await ApiToken.find({
      userId: auth.user._id,
      revokedAt: { $exists: false },
    })
      .sort({ createdAt: -1 })
      .lean();

    return {
      tokens: tokens.map((t) => ({
        id: String(t._id),
        name: t.name,
        scopes: t.scopes,
        createdAt:
          t.createdAt instanceof Date ? t.createdAt.toISOString() : null,
        lastUsedAt:
          t.lastUsedAt instanceof Date ? t.lastUsedAt.toISOString() : null,
      })),
    };
  },
});

export const POST = route({
  auth: "session",
  body: createBody,
  handler: async ({ auth, body }) => {
    if (!isDbConfigured()) throw new Errors.ServiceUnavailable();
    await connectDb();

    const raw = generatePatToken();
    const tokenHash = sha256(raw);
    const doc = await ApiToken.create({
      userId: auth.user._id,
      name: body.name,
      tokenHash,
      scopes: body.scopes ?? ["publish"],
    });

    return created({
      id: String(doc._id),
      name: doc.name,
      scopes: doc.scopes,
      // Raw token is returned ONCE here. Only the sha256 hash is stored.
      token: raw,
    });
  },
});
