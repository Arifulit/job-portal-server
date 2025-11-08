import { Request } from 'express';

export enum UserRole {
  ADMIN = 'admin',
  EMPLOYER = 'employer',
  RECRUITER = 'recruiter',
  JOB_SEEKER = 'job_seeker',
}

export enum JobStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  CLOSED = 'closed',
  DRAFT = 'draft',
}

export enum ApplicationStatus {
  APPLIED = 'applied',
  REVIEWING = 'reviewing',
  SHORTLISTED = 'shortlisted',
  INTERVIEWED = 'interviewed',
  OFFERED = 'offered',
  HIRED = 'hired',
  REJECTED = 'rejected',
}

export enum JobType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  INTERNSHIP = 'internship',
  FREELANCE = 'freelance',
}

export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  full_name: string;
  phone?: string;
  company_name?: string;
  profile_image?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface RefreshToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

export interface Job {
  id: string;
  employer_id: string;
  title: string;
  description: string;
  requirements: string[];
  job_type: JobType;
  location: string;
  salary_min?: number;
  salary_max?: number;
  status: JobStatus;
  deadline?: string;
  company_logo?: string;
  views_count: number;
  applications_count: number;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  job_id: string;
  applicant_id: string;
  status: ApplicationStatus;
  resume_url?: string;
  cover_letter?: string;
  applied_at: string;
  updated_at: string;
}

export interface AuthenticatedRequest extends Omit<Request, 'user'> {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}
