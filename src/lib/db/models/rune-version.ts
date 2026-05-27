import mongoose, {
  type HydratedDocument,
  type InferSchemaType,
  type Model,
  Schema,
} from "mongoose";

export const RUNE_LANGUAGES = [
  "typescript",
  "wasm",
  "python",
  "lua",
  "rust",
] as const;
export type RuneLanguage = (typeof RUNE_LANGUAGES)[number];

export const RUNE_VERSION_STATUSES = ["pending", "active", "yanked"] as const;
export type RuneVersionStatus = (typeof RUNE_VERSION_STATUSES)[number];

const runeVersionSchema = new Schema(
  {
    runeId: {
      type: Schema.Types.ObjectId,
      ref: "Rune",
      required: true,
      index: true,
    },
    version: { type: String, required: true },
    language: { type: String, enum: RUNE_LANGUAGES, required: true },
    /** sha256(canonical manifest JSON). Buffer of 32 bytes. */
    manifestHash: { type: Buffer, required: true, index: true },
    archiveSizeBytes: { type: Number, default: 0 },
    /** sha256 of the README blob (if any). */
    readmeBlobHash: Buffer,
    /** Plain-text rendering of README for indexing. */
    readmeText: String,
    capabilities: { type: [String], default: [] },
    /** sha256 of every blob this version references. Multikey-indexed for GC. */
    blobHashes: { type: [Buffer], default: [], index: true },
    status: {
      type: String,
      enum: RUNE_VERSION_STATUSES,
      default: "pending" satisfies RuneVersionStatus,
      index: true,
    },
    publishedAt: Date,
    publishedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    yankedAt: Date,
    yankedReason: String,
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
    collection: "runeversions",
  },
);

runeVersionSchema.index({ runeId: 1, version: 1 }, { unique: true });

export type RuneVersionSchema = InferSchemaType<typeof runeVersionSchema>;
export type RuneVersionDoc = HydratedDocument<RuneVersionSchema>;

export const RuneVersion: Model<RuneVersionSchema> =
  (mongoose.models.RuneVersion as Model<RuneVersionSchema> | undefined) ??
  mongoose.model<RuneVersionSchema>("RuneVersion", runeVersionSchema);
