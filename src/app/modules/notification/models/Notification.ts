import { Schema, model, Types } from "mongoose";

export interface INotification {
  userId: Types.ObjectId;
  type: "Application" | "Job";
  message: string;
  isRead: boolean;
  relatedId?: Types.ObjectId;
}

const notificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["Application", "Job"], required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  relatedId: { type: Schema.Types.ObjectId },
}, { timestamps: true });

// Speed up user notification counters (total/unread) for dashboards.
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = model<INotification>("Notification", notificationSchema);
