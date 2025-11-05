
import { z } from 'zod';
import { JobStatus } from '@/app/types';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const jobIdSchema = z.object({
  params: z.object({
    id: z.string().refine((v) => objectIdRegex.test(v) || uuidRegex.test(v), {
      message: 'Invalid job ID',
    }),
  }),
});

export const createJobSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    requirements: z.array(z.string()).optional(),
    job_type: z.string().min(1),
    location: z.string().optional(),
    salary_min: z.number().optional(),
    salary_max: z.number().optional(),
    deadline: z.string().optional(),
    company_logo: z.string().url().optional(),
  }),
});

export const updateJobSchema = z.object({
  params: z.object({ id: z.string().optional() }).optional(),
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    requirements: z.array(z.string()).optional(),
    job_type: z.string().optional(),
    location: z.string().optional(),
    salary_min: z.number().optional(),
    salary_max: z.number().optional(),
    deadline: z.string().optional(),
    company_logo: z.string().url().optional(),
    status: z.nativeEnum(JobStatus).optional(),
  }).refine((b) => Object.keys(b).length > 0, { message: 'At least one field must be provided' }),
});
