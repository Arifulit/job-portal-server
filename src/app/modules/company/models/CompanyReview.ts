import { Schema, model, Types } from "mongoose";

export interface ICompanyReview {
  company: Types.ObjectId;
  user: Types.ObjectId;
  rating: number;
  review?: string;
  isVisible: boolean;
  moderatedAt?: Date;
  moderatedBy?: Types.ObjectId;
}

const companyReviewSchema = new Schema<ICompanyReview>(
  {
    company: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, trim: true },
    isVisible: { type: Boolean, default: true },
    moderatedAt: { type: Date },
    moderatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

// One review per user per company keeps rating aggregation stable.
companyReviewSchema.index({ company: 1, user: 1 }, { unique: true });
companyReviewSchema.index({ company: 1, createdAt: -1 });

export const CompanyReview = model<ICompanyReview>("CompanyReview", companyReviewSchema);
