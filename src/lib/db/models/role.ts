import mongoose, {
  type HydratedDocument,
  type InferSchemaType,
  type Model,
  Schema,
} from "mongoose";

/**
 * Roles bundle permissions. System roles (`isSystem: true`, `orgId: null`)
 * are shipped as defaults and reused across every org. Org-specific custom
 * roles get their own document with `orgId` set.
 */
const roleSchema = new Schema(
  {
    /** Null for system roles, set for org-custom roles. */
    orgId: {
      type: Schema.Types.ObjectId,
      ref: "Org",
      index: true,
      default: null,
    },
    /** Slug-ish identifier (`owner`, `admin`, `member`, `release-manager`). */
    key: { type: String, required: true, lowercase: true, maxlength: 48 },
    name: { type: String, required: true, maxlength: 48 },
    description: { type: String, maxlength: 240 },
    permissions: { type: [String], default: [] },
    isSystem: { type: Boolean, default: false, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: true }, collection: "roles" },
);

// One role-key per org (or globally for system roles where orgId is null).
roleSchema.index({ orgId: 1, key: 1 }, { unique: true });

export type RoleSchema = InferSchemaType<typeof roleSchema>;
export type RoleDoc = HydratedDocument<RoleSchema>;

export const Role: Model<RoleSchema> =
  (mongoose.models.Role as Model<RoleSchema> | undefined) ??
  mongoose.model<RoleSchema>("Role", roleSchema);
