import { Schema, model, Types } from "mongoose";

export interface IRecruiterProfile {
  user: Types.ObjectId;
  agency: Types.ObjectId;
  company?: Types.ObjectId;
  designation: string;
  phone: string;
  bio?: string;
}

const recruiterProfileSchema = new Schema<IRecruiterProfile>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  agency: { type: Schema.Types.ObjectId, ref: "RecruitmentAgency", required: true },
  company: { type: Schema.Types.ObjectId, ref: "Company" },
  designation: { type: String, required: true },
  phone: { type: String, required: true },
  bio: { type: String, trim: true },
}, { timestamps: true });

export const RecruiterProfile = model<IRecruiterProfile>("RecruiterProfile", recruiterProfileSchema);
