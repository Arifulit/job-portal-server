
import { Schema, model, Types } from "mongoose";

export interface IApplication {
  candidate: Types.ObjectId;
  job: Types.ObjectId;
  status: "Applied" | "Reviewed" | "Interview" | "Hired" | "Rejected" | "Shortlisted" | "Withdrawn";
  resume?: string;
  coverLetter?: string;
}

const applicationSchema = new Schema<IApplication>({
  candidate: { type: Schema.Types.ObjectId, ref: "User", required: true },
  job: { type: Schema.Types.ObjectId, ref: "Job", required: true },
  status: { 
    type: String, 
    enum: ["Applied", "Reviewed", "Interview", "Hired", "Rejected","Shortlisted","Withdrawn"], 
    default: "Applied" 
  },
  resume: { type: String },
  coverLetter: { type: String },
}, { timestamps: true });

// Speed up dashboard statistics queries by candidate/job/status.
applicationSchema.index({ candidate: 1, status: 1 });
applicationSchema.index({ job: 1, status: 1 });

export const Application = model<IApplication>("Application", applicationSchema);