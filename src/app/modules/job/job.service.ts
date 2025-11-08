
import { JobStatus, UserRole } from '@/app/types';
import { NotFoundError, ForbiddenError, ValidationError } from '@/app/utils/errors';
import { logger } from '@/app/utils/logger';
import { IJob, Job } from './job.model';

export const JobService = {
  async createJob(employerId: string, jobData: Partial<IJob>) {
    try {
      const newJob = await Job.create({
        ...jobData,
        employer_id: employerId,
        status: JobStatus.ACTIVE,
        views_count: 0,
        applications_count: 0,
      });
      return newJob;
    } catch (err: any) {
      logger.error('JobService.createJob error:', err);
      throw new ValidationError(err.message || 'Failed to create job');
    }
  },

  async getAllJobs(filters?: any) {
    try {
      const query: any = { status: JobStatus.ACTIVE };

      if (filters?.job_type) query.job_type = filters.job_type;
      if (filters?.location) query.location = { $regex: filters.location, $options: 'i' };
      if (filters?.search)
        query.$or = [
          { title: { $regex: filters.search, $options: 'i' } },
          { description: { $regex: filters.search, $options: 'i' } },
        ];

      const jobs = await Job.find(query).sort({ created_at: -1 });
      return jobs;
    } catch (err: any) {
      logger.error('JobService.getAllJobs error:', err);
      throw new ValidationError(err.message || 'Failed to retrieve jobs');
    }
  },

  async getJobById(jobId: string) {
    const job = await Job.findById(jobId);
    if (!job) throw new NotFoundError('Job not found');

    try {
      job.views_count += 1;
      await job.save();
    } catch (err) {
      logger.warn('JobService.getJobById increment views_count failed', err);
    }

    return job;
  },

  async getEmployerJobs(employerId: string) {
    return await Job.find({ employer_id: employerId }).sort({ created_at: -1 });
  },

  async updateJob(jobId: string, employerId: string, userRole: UserRole, updates: Partial<IJob>) {
    const job = await Job.findById(jobId);
    if (!job) throw new NotFoundError('Job not found');

    if (userRole !== UserRole.ADMIN && job.employer_id !== employerId)
      throw new ForbiddenError('Not permitted to update this job');

    Object.assign(job, updates, { updated_at: new Date() });
    await job.save();
    return job;
  },

  async deleteJob(jobId: string, employerId: string, userRole: UserRole) {
    const job = await Job.findById(jobId);
    if (!job) throw new NotFoundError('Job not found');

    if (userRole !== UserRole.ADMIN && job.employer_id !== employerId)
      throw new ForbiddenError('Not permitted to delete this job');

    await job.deleteOne();
    return { message: 'Job deleted successfully' };
  },
};
