import mongoose, {
  type HydratedDocument,
  type InferSchemaType,
  type Model,
  Schema,
} from "mongoose";

export const ORG_NAME_PATTERN = /^[a-z0-9-]+$/;

const orgSchema = new Schema(
  {
    /**
     * Globally-unique scope name. Shares a namespace with `User.username` —
     * see `claimScope()` for the cross-collection uniqueness check.
     */
    name: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      minlength: 3,
      maxlength: 32,
      match: ORG_NAME_PATTERN,
    },
    displayName: String,
    description: { type: String, maxlength: 280 },
    homepage: String,
    avatarUrl: String,
    /** The user who can delete or transfer the org. Singular by design. */
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    suspendedAt: Date,
    suspendedReason: String,
  },
  { timestamps: { createdAt: true, updatedAt: true }, collection: "orgs" },
);

export type OrgSchema = InferSchemaType<typeof orgSchema>;
export type OrgDoc = HydratedDocument<OrgSchema>;

export const Org: Model<OrgSchema> =
  (mongoose.models.Org as Model<OrgSchema> | undefined) ??
  mongoose.model<OrgSchema>("Org", orgSchema);
