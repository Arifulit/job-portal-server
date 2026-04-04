import { Schema, model, Types } from "mongoose";

export interface INotification {
  user: Types.ObjectId;
  type: "Application" | "Job";
  message: string;
  read: boolean;
  relatedId?: Types.ObjectId;
}

const notificationSchema = new Schema<INotification>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["Application", "Job"], required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  relatedId: { type: Schema.Types.ObjectId },
}, { timestamps: true });

// Speed up user notification counters (total/unread) for dashboards.
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export const Notification = model<INotification>("Notification", notificationSchema);
