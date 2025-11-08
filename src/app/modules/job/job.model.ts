import { Schema, model, Document } from 'mongoose';
import { JobStatus } from '@/app/types';

export interface IJob extends Document {
  title: string;
  description: string;
  requirements?: string[];
  job_type: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  deadline?: Date;
  company_logo?: string;
  employer_id: string;
  status: JobStatus;
  views_count: number;
  applications_count: number;
  created_at: Date;
  updated_at: Date;
}

const jobSchema = new Schema<IJob>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  requirements: { type: [String], default: [] },
  job_type: { type: String, required: true },
  location: String,
  salary_min: Number,
  salary_max: Number,
  deadline: Date,
  company_logo: String,
  employer_id: { type: String, required: true },
  status: { type: String, enum: Object.values(JobStatus), default: JobStatus.ACTIVE },
  views_count: { type: Number, default: 0 },
  applications_count: { type: Number, default: 0 },
  created_at: { type: Date, default: () => new Date() },
  updated_at: { type: Date, default: () => new Date() },
});

export const Job = model<IJob>('Job', jobSchema);
