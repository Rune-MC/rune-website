import mongoose, {
  type HydratedDocument,
  type InferSchemaType,
  type Model,
  Schema,
} from "mongoose";

export const RUNE_NAME_PATTERN = /^(@[a-z0-9-]+\/)?[a-z0-9-]+$/;
export const RUNE_OWNER_ROLES = ["owner", "maintainer"] as const;
export type RuneOwnerRole = (typeof RUNE_OWNER_ROLES)[number];

const ownerSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: {
      type: String,
      enum: RUNE_OWNER_ROLES,
      default: "owner" satisfies RuneOwnerRole,
    },
    grantedAt: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

const runeSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      match: RUNE_NAME_PATTERN,
    },
    description: { type: String, maxlength: 280 },
    homepage: String,
    repository: String,
    license: String,
    latestVersion: String,
    latestVersionId: { type: Schema.Types.ObjectId, ref: "RuneVersion" },
    totalDownloads: { type: Number, default: 0 },
    owners: { type: [ownerSchema], default: [] },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
    collection: "runes",
  },
);

// Text index for $text search fallback. Atlas Search (when configured)
// indexes the same fields via the `default` index and is queried via
// `$search` instead — see `src/app/api/v1/search/route.ts`.
runeSchema.index(
  { name: "text", description: "text" },
  { weights: { name: 10, description: 1 } },
);

export type RuneSchema = InferSchemaType<typeof runeSchema>;
export type RuneDoc = HydratedDocument<RuneSchema>;

export const Rune: Model<RuneSchema> =
  (mongoose.models.Rune as Model<RuneSchema> | undefined) ??
  mongoose.model<RuneSchema>("Rune", runeSchema);
