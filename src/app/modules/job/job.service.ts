import { getDatabase } from '@/app/config/database';
import { JobStatus, UserRole } from '@/app/types';
import { NotFoundError, ForbiddenError, ValidationError } from '@/app/utils/errors';
import { logger } from '@/app/utils/logger';

type AnyDB = any;

const createJob = async (employerId: string, jobData: any): Promise<any> => {
  const db = getDatabase() as AnyDB;

  try {
    const { data: newJob, error } = await db
      .from('jobs')
      .insert({
        employer_id: employerId,
        ...jobData,
        status: JobStatus.ACTIVE,
        views_count: 0,
        applications_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('JobService.createJob: insert error', error);
      throw new ValidationError('Failed to create job posting');
    }

    return newJob;
  } catch (err: any) {
    logger.error('JobService.createJob unexpected error', err);
    throw new ValidationError(err?.message || 'Failed to create job posting');
  }
};

const getAllJobs = async (filters?: any): Promise<any[]> => {
  const db = getDatabase() as AnyDB;

  try {
    let query: any = db.from('jobs').select('*').eq('status', JobStatus.ACTIVE);

    if (filters?.job_type) {
      query = query.eq('job_type', filters.job_type);
    }

    if (filters?.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data: jobs, error } = await query.order('created_at', { ascending: false });

    if (error) {
      logger.error('JobService.getAllJobs: query error', error);
      throw new ValidationError('Failed to retrieve jobs');
    }

    return jobs || [];
  } catch (err: any) {
    logger.error('JobService.getAllJobs unexpected error', err);
    throw new ValidationError(err?.message || 'Failed to retrieve jobs');
  }
};

const getJobById = async (jobId: string): Promise<any> => {
  const db = getDatabase() as AnyDB;

  try {
    const { data: job, error } = await db.from('jobs').select('*').eq('id', jobId).maybeSingle();

    if (error || !job) {
      throw new NotFoundError('Job not found');
    }

    try {
      await db
        .from('jobs')
        .update({ views_count: (job.views_count || 0) + 1, updated_at: new Date().toISOString() })
        .eq('id', jobId);
    } catch (e) {
      logger.warn('JobService.getJobById: failed to increment views_count', e);
    }

    return job;
  } catch (err: any) {
    logger.error('JobService.getJobById error', err);
    if (err instanceof NotFoundError) throw err;
    throw new ValidationError(err?.message || 'Failed to retrieve job');
  }
};

const getEmployerJobs = async (employerId: string): Promise<any[]> => {
  const db = getDatabase() as AnyDB;

  try {
    const { data: jobs, error } = await db
      .from('jobs')
      .select('*')
      .eq('employer_id', employerId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('JobService.getEmployerJobs: query error', error);
      throw new ValidationError('Failed to retrieve jobs');
    }

    return jobs || [];
  } catch (err: any) {
    logger.error('JobService.getEmployerJobs unexpected error', err);
    throw new ValidationError(err?.message || 'Failed to retrieve jobs');
  }
};

const updateJob = async (jobId: string, employerId: string, userRole: UserRole, updates: any): Promise<any> => {
  const db = getDatabase() as AnyDB;

  try {
    const { data: existingJob } = await db.from('jobs').select('employer_id').eq('id', jobId).maybeSingle();

    if (!existingJob) {
      throw new NotFoundError('Job not found');
    }

    if (userRole !== UserRole.ADMIN && existingJob.employer_id !== employerId) {
      throw new ForbiddenError('You do not have permission to update this job');
    }

    updates.updated_at = new Date().toISOString();

    const { data: updatedJob, error } = await db
      .from('jobs')
      .update(updates)
      .eq('id', jobId)
      .select()
      .single();

    if (error) {
      logger.error('JobService.updateJob: update error', error);
      throw new ValidationError('Failed to update job');
    }

    return updatedJob;
  } catch (err: any) {
    logger.error('JobService.updateJob unexpected error', err);
    if (err instanceof NotFoundError || err instanceof ForbiddenError) throw err;
    throw new ValidationError(err?.message || 'Failed to update job');
  }
};

const deleteJob = async (jobId: string, employerId: string, userRole: UserRole): Promise<any> => {
  const db = getDatabase() as AnyDB;

  try {
    const { data: existingJob } = await db.from('jobs').select('employer_id').eq('id', jobId).maybeSingle();

    if (!existingJob) {
      throw new NotFoundError('Job not found');
    }

    if (userRole !== UserRole.ADMIN && existingJob.employer_id !== employerId) {
      throw new ForbiddenError('You do not have permission to delete this job');
    }

    const { error } = await db.from('jobs').delete().eq('id', jobId);

    if (error) {
      logger.error('JobService.deleteJob: delete error', error);
      throw new ValidationError('Failed to delete job');
    }

    return { message: 'Job deleted successfully' };
  } catch (err: any) {
    logger.error('JobService.deleteJob unexpected error', err);
    if (err instanceof NotFoundError || err instanceof ForbiddenError) throw err;
    throw new ValidationError(err?.message || 'Failed to delete job');
  }
};

export const JobService = {
  createJob,
  getAllJobs,
  getJobById,
  getEmployerJobs,
  updateJob,
  deleteJob,
};