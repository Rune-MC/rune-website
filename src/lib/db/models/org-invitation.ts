import mongoose, {
  type HydratedDocument,
  type InferSchemaType,
  type Model,
  Schema,
} from "mongoose";

export const ORG_INVITATION_STATUSES = [
  "pending",
  "accepted",
  "declined",
  "revoked",
  "expired",
] as const;
export type OrgInvitationStatus = (typeof ORG_INVITATION_STATUSES)[number];

const orgInvitationSchema = new Schema(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: "Org",
      required: true,
      index: true,
    },
    /** Lowercase email. The invitee may not have a User record yet. */
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    roleId: { type: Schema.Types.ObjectId, ref: "Role", required: true },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    /** Opaque random token used as the URL parameter (`/invitations/<token>`). */
    token: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ORG_INVITATION_STATUSES,
      default: "pending" satisfies OrgInvitationStatus,
      index: true,
    },
    acceptedAt: Date,
    acceptedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
    collection: "orginvitations",
  },
);

// One outstanding invite per (org, email).
orgInvitationSchema.index(
  { orgId: 1, email: 1, status: 1 },
  { partialFilterExpression: { status: "pending" } },
);

export type OrgInvitationSchema = InferSchemaType<typeof orgInvitationSchema>;
export type OrgInvitationDoc = HydratedDocument<OrgInvitationSchema>;

export const OrgInvitation: Model<OrgInvitationSchema> =
  (mongoose.models.OrgInvitation as Model<OrgInvitationSchema> | undefined) ??
  mongoose.model<OrgInvitationSchema>("OrgInvitation", orgInvitationSchema);
