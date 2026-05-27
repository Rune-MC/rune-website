import mongoose, {
  type HydratedDocument,
  type InferSchemaType,
  type Model,
  Schema,
} from "mongoose";

const auditLogSchema = new Schema(
  {
    /** Who performed the action. Null for system-initiated events. */
    actorUserId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    /** Optional org context. */
    orgId: { type: Schema.Types.ObjectId, ref: "Org", index: true },
    /** Action verb, e.g. "org.created", "rune.yanked", "user.suspended". */
    action: { type: String, required: true, index: true },
    /** Free-form structured payload (target ids, before/after, reason). */
    data: { type: Schema.Types.Mixed, default: {} },
    /** Best-effort remote IP / user agent if the request carried them. */
    ip: String,
    userAgent: String,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "auditlogs",
  },
);

export type AuditLogSchema = InferSchemaType<typeof auditLogSchema>;
export type AuditLogDoc = HydratedDocument<AuditLogSchema>;

export const AuditLog: Model<AuditLogSchema> =
  (mongoose.models.AuditLog as Model<AuditLogSchema> | undefined) ??
  mongoose.model<AuditLogSchema>("AuditLog", auditLogSchema);
