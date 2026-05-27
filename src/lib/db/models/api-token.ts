import mongoose, {
  type HydratedDocument,
  type InferSchemaType,
  type Model,
  Schema,
} from "mongoose";

export const API_TOKEN_SCOPES = ["publish", "read"] as const;
export type ApiTokenScope = (typeof API_TOKEN_SCOPES)[number];

const apiTokenSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    tokenHash: { type: Buffer, required: true, unique: true },
    scopes: {
      type: [String],
      default: ["publish"],
      enum: API_TOKEN_SCOPES,
    },
    lastUsedAt: Date,
    revokedAt: Date,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "apitokens",
  },
);

export type ApiTokenSchema = InferSchemaType<typeof apiTokenSchema>;
export type ApiTokenDoc = HydratedDocument<ApiTokenSchema>;

export const ApiToken: Model<ApiTokenSchema> =
  (mongoose.models.ApiToken as Model<ApiTokenSchema> | undefined) ??
  mongoose.model<ApiTokenSchema>("ApiToken", apiTokenSchema);
