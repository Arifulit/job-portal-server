import { Schema, model, Types } from "mongoose";

interface ICandidateExperienceItem {
  company: string;
  role: string;
  startDate?: Date;
  endDate?: Date;
  description?: string;
}

interface ICandidateEducationItem {
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface ICandidateProfile {
  user: Types.ObjectId;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  bio?: string;
  skills?: string[];
  experience?: ICandidateExperienceItem[];
  education?: ICandidateEducationItem[];
  resume?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  __v?: number;
}

const candidateProfileSchema = new Schema<ICandidateProfile>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: false },
  email: { type: String },
  address: { type: String, required: false },
  bio: { type: String, default: "", required: false },
  skills: [{ type: String }],
  experience: [{
    company: { type: String, required: true },
    role: { type: String, required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    description: { type: String }
  }],
  education: [{
    institution: { type: String, required: true },
    degree: { type: String, required: true },
    fieldOfStudy: { type: String },
    startDate: { type: Date },
    endDate: { type: Date }
  }],
  resume: { type: Schema.Types.ObjectId, ref: "Resume" }
}, { timestamps: true });

export const CandidateProfile = model<ICandidateProfile>("CandidateProfile", candidateProfileSchema);
