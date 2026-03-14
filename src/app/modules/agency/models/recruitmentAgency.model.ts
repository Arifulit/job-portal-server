// src/models/recruitmentAgency.model.ts
import { Schema, model, models, Model } from "mongoose";

export interface IRecruitmentAgency {
  name: string;
  website?: string;
  size?: string;
  industry?: string;
}

const recruitmentAgencySchema = new Schema<IRecruitmentAgency>(
  {
    name: { type: String, required: true },
    website: { type: String },
    size: { type: String },
    industry: { type: String },
  },
  { timestamps: true }
);

export const RecruitmentAgency =
  (models.RecruitmentAgency as Model<IRecruitmentAgency>) ||
  model<IRecruitmentAgency>("RecruitmentAgency", recruitmentAgencySchema);
