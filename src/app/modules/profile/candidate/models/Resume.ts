import { Schema, model, Types } from "mongoose";

export interface IResume {
  candidate: Types.ObjectId;
  fileUrl: string;
  fileName: string;
  score?: number;
  scoreBreakdown?: Record<string, number>;
  extractedSkills?: string[];
  missingSkills?: string[];
  suggestions?: string[];
  strengths?: string[];
  analyzedAt?: Date;
}

const resumeSchema = new Schema<IResume>({
  candidate: { type: Schema.Types.ObjectId, ref: "CandidateProfile", required: true },
  fileUrl: { type: String, required: true },
  fileName: { type: String, required: true },
  score: { type: Number, default: null },
  scoreBreakdown: { type: Schema.Types.Mixed, default: {} },
  extractedSkills: { type: [String], default: [] },
  missingSkills: { type: [String], default: [] },
  suggestions: { type: [String], default: [] },
  strengths: { type: [String], default: [] },
  analyzedAt: { type: Date }
}, { timestamps: true });

export const Resume = model<IResume>("Resume", resumeSchema);
