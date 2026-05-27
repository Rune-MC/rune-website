import { isValidObjectId } from "mongoose";
import { z } from "zod";
import { Errors, noContent, route } from "@/lib/api";
import { connectDb, isDbConfigured } from "@/lib/db";
import { ApiToken } from "@/lib/db/models/api-token";

const params = z.object({
  id: z.string().refine(isValidObjectId, "Invalid token id"),
});

export const DELETE = route({
  auth: "session",
  params,
  handler: async ({ auth, params }) => {
    if (!isDbConfigured()) throw new Errors.ServiceUnavailable();
    await connectDb();

    const token = await ApiToken.findOne({
      _id: params.id,
      userId: auth.user._id,
    });
    if (!token) throw new Errors.NotFound("Token not found");
    if (token.revokedAt) throw new Errors.Conflict("Token already revoked");

    token.revokedAt = new Date();
    await token.save();

    return noContent();
  },
});
