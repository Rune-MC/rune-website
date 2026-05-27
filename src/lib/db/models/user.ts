import mongoose, {
  type HydratedDocument,
  type InferSchemaType,
  type Model,
  Schema,
} from "mongoose";

export const PLATFORM_ROLES = ["owner", "admin"] as const;
export type PlatformRole = (typeof PLATFORM_ROLES)[number];

const userSchema = new Schema(
  {
    /** GitHub user numeric id. Stable across username changes — our primary link. */
    githubId: { type: Number, required: true, unique: true, index: true },
    /** The user's GitHub login at the time of last sign-in. Display + audit only. */
    githubLogin: { type: String, required: true },
    /** Primary email from GitHub. May be null if the user has none verified. */
    email: String,
    username: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      lowercase: true,
      minlength: 3,
      maxlength: 32,
      match: /^[a-z0-9-]+$/,
    },
    displayName: String,
    avatarUrl: String,
    emailVisible: { type: Boolean, default: false },
    /**
     * Platform-level role. Only set for Rune staff. Regular users have no
     * platform role and are bound only by their org memberships.
     */
    platformRole: {
      type: String,
      enum: PLATFORM_ROLES,
      required: false,
    },
    /** Suspended users cannot publish, accept invitations, or sign in. */
    suspendedAt: Date,
    suspendedReason: String,
  },
  { timestamps: { createdAt: true, updatedAt: true }, collection: "users" },
);

export type UserSchema = InferSchemaType<typeof userSchema>;
export type UserDoc = HydratedDocument<UserSchema>;

export const User: Model<UserSchema> =
  (mongoose.models.User as Model<UserSchema> | undefined) ??
  mongoose.model<UserSchema>("User", userSchema);
