// এই model job posting schema, validation, এবং status metadata define করে।
import { Schema, model, Document, Types } from 'mongoose';

const toIdString = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (value instanceof Types.ObjectId) return value.toString();
  if (typeof value === "object" && value !== null && "_id" in value) {
    const nestedId = (value as { _id?: unknown })._id;
    if (nestedId instanceof Types.ObjectId) return nestedId.toString();
    if (typeof nestedId === "string") return nestedId.trim();
  }
  if (typeof value === "object" && value !== null && "toString" in value) {
    return (value as { toString: () => string }).toString().trim();
  }
  return "";
};

const normalizeKeyPart = (value: unknown): string =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

export const buildJobUniquenessKey = (payload: {
  createdBy?: unknown;
  company?: unknown;
  title?: unknown;
  location?: unknown;
  jobType?: unknown;
}): string => {
  const creatorId = toIdString(payload.createdBy);
  const companyId = toIdString(payload.company);
  const title = normalizeKeyPart(payload.title);
  const location = normalizeKeyPart(payload.location);
  const jobType = normalizeKeyPart(payload.jobType);

  return [creatorId, companyId, title, location, jobType].join("|");
};

export interface IStatusHistory {
  status: 'pending' | 'approved' | 'rejected' | 'closed';
  changedBy: Types.ObjectId;
  changedAt: Date;
  reason?: string;
}

export interface IJobUpdateData {
  title?: string;
  description?: string;
  responsibilities?: string[];
  requirements?: string[];
  education?: string[];
  additionalRequirements?: string[];
  businessAreas?: string[];
  jobContext?: string;
  ageMin?: number;
  ageMax?: number;
  genderPreference?: 'any' | 'male' | 'female' | 'other';
  preferredIndustryExperience?: string;
  preferredExperienceYears?: number;
  location?: string;
  jobType?: string;
  salary?: number;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  experience?: string;
  experienceLevel?: string;
  deadline?: Date;
  vacancies?: number;
  skills?: string[];
  status?: 'pending' | 'approved' | 'rejected' | 'closed';
  rejectionReason?: string;
  statusHistory?: IStatusHistory[];
  closedAt?: Date;
  closedBy?: Types.ObjectId;
  approvedAt?: Date;
  approvedBy?: Types.ObjectId;
  rejectedAt?: Date;
  rejectedBy?: Types.ObjectId;
}

export interface IJob extends Document {
  title: string;
  description: string;
  responsibilities?: string[];
  requirements: string[];
  education?: string[];
  additionalRequirements?: string[];
  businessAreas?: string[];
  jobContext?: string;
  ageMin?: number;
  ageMax?: number;
  genderPreference?: 'any' | 'male' | 'female' | 'other';
  preferredIndustryExperience?: string;
  preferredExperienceYears?: number;
  location: string;
  jobType: string;
  salary?: number;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  experience?: string;
  experienceLevel?: string;
  deadline?: Date;
  vacancies?: number;
  skills: string[];
  createdBy: Schema.Types.ObjectId;
  company: Schema.Types.ObjectId; 
  jobKey?: string;
  status: 'pending' | 'approved' | 'rejected' | 'closed';
  isApproved: boolean;
  rejectionReason?: string;
  statusHistory: IStatusHistory[];
  closedAt?: Date;
  closedBy?: Types.ObjectId;
  approvedAt?: Date;
  approvedBy?: Types.ObjectId;
  rejectedAt?: Date;
  rejectedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new Schema<IJob>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  responsibilities: [{ type: String }],
  requirements: [{ type: String }],
  education: [{ type: String }],
  additionalRequirements: [{ type: String }],
  businessAreas: [{ type: String }],
  jobContext: { type: String },
  ageMin: { type: Number, min: 0 },
  ageMax: { type: Number, min: 0 },
  genderPreference: {
    type: String,
    enum: ['any', 'male', 'female', 'other'],
    default: 'any',
  },
  preferredIndustryExperience: { type: String },
  preferredExperienceYears: { type: Number, min: 0 },
  location: { type: String, required: true },
  jobType: { 
    type: String, 
    enum: ['full-time', 'part-time', 'contract', 'internship', 'freelance'],
    required: true 
  },
  salary: { type: Number },
  salaryMin: { type: Number },
  salaryMax: { type: Number },
  currency: { type: String, default: "BDT" },
  experience: { type: String },
  experienceLevel: { 
    type: String, 
    enum: ['entry', 'mid-level', 'senior', 'lead', 'executive'],
    required: true 
  },
  deadline: { type: Date },
  vacancies: { type: Number, min: 1, default: 1 },
  skills: [{ type: String }],
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  company: { 
    type: Schema.Types.ObjectId, 
    ref: 'Company',
    required: true 
  },
  jobKey: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'closed'],
    default: 'pending'
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  statusHistory: [{
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected', 'closed'],
      required: true 
    },
    changedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      required: true 
    },
    changedAt: { 
      type: Date, 
      default: Date.now 
    },
    reason: String
  }],
  closedAt: { type: Date },
  closedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  rejectedAt: { type: Date },
  rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { 
  timestamps: true,
  autoIndex: true 
});

// Create text index for search
jobSchema.index({
  title: 'text',
  description: 'text',
  responsibilities: 'text',
  requirements: 'text',
  education: 'text',
  additionalRequirements: 'text',
  businessAreas: 'text',
  jobContext: 'text',
  preferredIndustryExperience: 'text',
  skills: 'text'
}, {
  weights: {
    title: 10,
    responsibilities: 7,
    requirements: 5,
    education: 4,
    additionalRequirements: 4,
    businessAreas: 3,
    jobContext: 4,
    preferredIndustryExperience: 2,
    skills: 3,
    description: 1
  },
  name: 'job_search_index'
});

// Speed up recruiter/admin dashboard filters and counts.
jobSchema.index({ createdBy: 1, status: 1 });
jobSchema.index({ status: 1, isApproved: 1 });
jobSchema.index({ jobKey: 1 }, { unique: true, sparse: true, name: "job_unique_key_idx" });

jobSchema.pre("validate", function (next) {
  const shouldRefreshKey =
    this.isNew ||
    this.isModified("createdBy") ||
    this.isModified("company") ||
    this.isModified("title") ||
    this.isModified("location") ||
    this.isModified("jobType");

  if (!shouldRefreshKey) {
    next();
    return;
  }

  this.set(
    "jobKey",
    buildJobUniquenessKey({
      createdBy: this.get("createdBy"),
      company: this.get("company"),
      title: this.get("title"),
      location: this.get("location"),
      jobType: this.get("jobType"),
    }),
  );

  next();
});

export const Job = model<IJob>('Job', jobSchema);