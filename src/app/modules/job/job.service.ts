import { getDatabase } from '@/app/config/database';
import { JobStatus, UserRole } from '@/app/types';
import { NotFoundError, ForbiddenError, ValidationError } from '@/app/utils/errors';
import { logger } from '@/app/utils/logger';

export class JobService {
  static async createJob(employerId: string, jobData: any) {
    const db = getDatabase();

    const { data: newJob, error } = await db
      .from('jobs')
      .insert({
        employer_id: employerId,
        ...jobData,
        status: JobStatus.ACTIVE,
        views_count: 0,
        applications_count: 0,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create job:', error);
      throw new ValidationError('Failed to create job posting');
    }

    return newJob;
  }

  static async getAllJobs(filters?: any) {
    const db = getDatabase();
    let query = db.from('jobs').select('*').eq('status', JobStatus.ACTIVE);

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
      logger.error('Failed to fetch jobs:', error);
      throw new ValidationError('Failed to retrieve jobs');
    }

    return jobs;
  }

  static async getJobById(jobId: string) {
    const db = getDatabase();

    const { data: job, error } = await db.from('jobs').select('*').eq('id', jobId).maybeSingle();

    if (error || !job) {
      throw new NotFoundError('Job not found');
    }

    await db
      .from('jobs')
      .update({ views_count: job.views_count + 1 })
      .eq('id', jobId);

    return job;
  }

  static async getEmployerJobs(employerId: string) {
    const db = getDatabase();

    const { data: jobs, error } = await db
      .from('jobs')
      .select('*')
      .eq('employer_id', employerId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch employer jobs:', error);
      throw new ValidationError('Failed to retrieve jobs');
    }

    return jobs;
  }

  static async updateJob(jobId: string, employerId: string, userRole: UserRole, updates: any) {
    const db = getDatabase();

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
      logger.error('Failed to update job:', error);
      throw new ValidationError('Failed to update job');
    }

    return updatedJob;
  }

  static async deleteJob(jobId: string, employerId: string, userRole: UserRole) {
    const db = getDatabase();

    const { data: existingJob } = await db.from('jobs').select('employer_id').eq('id', jobId).maybeSingle();

    if (!existingJob) {
      throw new NotFoundError('Job not found');
    }

    if (userRole !== UserRole.ADMIN && existingJob.employer_id !== employerId) {
      throw new ForbiddenError('You do not have permission to delete this job');
    }

    const { error } = await db.from('jobs').delete().eq('id', jobId);

    if (error) {
      logger.error('Failed to delete job:', error);
      throw new ValidationError('Failed to delete job');
    }

    return { message: 'Job deleted successfully' };
  }
}
