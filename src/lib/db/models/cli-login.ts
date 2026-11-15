import mongoose, { type InferSchemaType, type Model, Schema } from "mongoose";

const cliLoginSchema = new Schema({
  deviceHash: { type: String, required: true, unique: true },
  userCode: { type: String, required: true, unique: true },
  challenge: { type: String, required: true },
  redirectUri: String,
  state: String,
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  expiresAt: { type: Date, required: true, expires: 0 },
  nextPollAt: { type: Date, required: true },
  sourceHash: String,
  createdAt: { type: Date, required: true },
});
cliLoginSchema.index({ sourceHash: 1, createdAt: 1 });

type CliLoginSchema = InferSchemaType<typeof cliLoginSchema>;

export const CliLogin: Model<CliLoginSchema> =
  (mongoose.models.CliLogin as Model<CliLoginSchema> | undefined) ??
  mongoose.model<CliLoginSchema>("CliLogin", cliLoginSchema);
