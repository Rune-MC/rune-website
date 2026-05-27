import mongoose, {
  type HydratedDocument,
  type InferSchemaType,
  type Model,
  Schema,
} from "mongoose";

export const RUNE_NAME_PATTERN = /^(@[a-z0-9-]+\/)?[a-z0-9-]+$/;
export const RUNE_OWNER_KINDS = ["user", "org"] as const;
export type RuneOwnerKind = (typeof RUNE_OWNER_KINDS)[number];
export const RUNE_VISIBILITIES = ["public", "private"] as const;
export type RuneVisibility = (typeof RUNE_VISIBILITIES)[number];

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
    /**
     * Canonical owner — what determines the scope. A user-owned Rune
     * derives `@<username>/foo` (or no scope if the user is unscoped); an
     * org-owned Rune derives `@<orgname>/foo`.
     */
    ownerKind: {
      type: String,
      enum: RUNE_OWNER_KINDS,
      required: true,
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    /**
     * Additional users who can publish/yank for this Rune. Org-owned Runes
     * use the org's RBAC instead of this list; this is for user-owned
     * Runes that want collaborator access.
     */
    maintainerIds: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    /**
     * `public` — anyone can browse and install.
     * `private` — only the owner (or org members) and platform staff can
     * see the Rune in listings and fetch its manifest. Underlying blobs
     * are still served publicly since they're content-addressed and may
     * be shared with public Runes.
     */
    visibility: {
      type: String,
      enum: RUNE_VISIBILITIES,
      default: "public" satisfies RuneVisibility,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
    collection: "runes",
  },
);

// Text index for $text search fallback.
runeSchema.index(
  { name: "text", description: "text" },
  { weights: { name: 10, description: 1 } },
);

export type RuneSchema = InferSchemaType<typeof runeSchema>;
export type RuneDoc = HydratedDocument<RuneSchema>;

export const Rune: Model<RuneSchema> =
  (mongoose.models.Rune as Model<RuneSchema> | undefined) ??
  mongoose.model<RuneSchema>("Rune", runeSchema);
