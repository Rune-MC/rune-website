import mongoose, {
  type HydratedDocument,
  type InferSchemaType,
  type Model,
  Schema,
} from "mongoose";

const userSchema = new Schema(
  {
    locksmithSub: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
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
  },
  { timestamps: { createdAt: true, updatedAt: true }, collection: "users" },
);

export type UserSchema = InferSchemaType<typeof userSchema>;
export type UserDoc = HydratedDocument<UserSchema>;

export const User: Model<UserSchema> =
  (mongoose.models.User as Model<UserSchema> | undefined) ??
  mongoose.model<UserSchema>("User", userSchema);
