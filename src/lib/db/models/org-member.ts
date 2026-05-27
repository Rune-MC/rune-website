import mongoose, {
  type HydratedDocument,
  type InferSchemaType,
  type Model,
  Schema,
} from "mongoose";

const orgMemberSchema = new Schema(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: "Org",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    /** References a system role (orgId: null) or a custom role for this org. */
    roleId: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    /**
     * Optional ad-hoc permission grants beyond the role. Reserved for
     * future use; the resolver merges these on top of role permissions.
     */
    extraPermissions: { type: [String], default: [] },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User" },
    joinedAt: { type: Date, default: () => new Date() },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
    collection: "orgmembers",
  },
);

orgMemberSchema.index({ orgId: 1, userId: 1 }, { unique: true });

export type OrgMemberSchema = InferSchemaType<typeof orgMemberSchema>;
export type OrgMemberDoc = HydratedDocument<OrgMemberSchema>;

export const OrgMember: Model<OrgMemberSchema> =
  (mongoose.models.OrgMember as Model<OrgMemberSchema> | undefined) ??
  mongoose.model<OrgMemberSchema>("OrgMember", orgMemberSchema);
