import { Schema, model, Types } from "mongoose";

export interface ISystemAnnouncement {
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  targetAudience: "all" | "candidate" | "recruiter";
  createdBy: Types.ObjectId;
  isActive: boolean;
}

const systemAnnouncementSchema = new Schema<ISystemAnnouncement>({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ["info", "warning", "success", "error"],
    default: "info",
  },
  targetAudience: {
    type: String,
    enum: ["all", "candidate", "recruiter"],
    default: "all",
  },
  createdBy: { type: Schema.Types.ObjectId, ref: "AdminProfile", required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const SystemAnnouncement = model<ISystemAnnouncement>("SystemAnnouncement", systemAnnouncementSchema);
