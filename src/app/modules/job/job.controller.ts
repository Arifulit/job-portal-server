import { Response, NextFunction } from 'express';
import { JobService } from './job.service';
import { ResponseHandler } from '@/app/utils/response';
import { AuthenticatedRequest } from '@/app/types';
import { Request } from 'express';

export class JobController {

  static async createJob(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      console.info('createJob req.user:', req.user);
      const job = await JobService.createJob(req.user!.id, req.body);
      ResponseHandler.created(res, 'Job created successfully', { job });
    } catch (error) {
      next(error);
    }
  }

  static async getAllJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const jobs = await JobService.getAllJobs(req.query);
      ResponseHandler.success(res, 'Jobs retrieved successfully', { jobs, count: jobs.length });
    } catch (error) {
      next(error);
    }
  }

  static async getJobById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const job = await JobService.getJobById(req.params.id);
      ResponseHandler.success(res, 'Job retrieved successfully', { job });
    } catch (error) {
      next(error);
    }
  }

  static async getMyJobs(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const jobs = await JobService.getEmployerJobs(req.user!.id);
      ResponseHandler.success(res, 'Jobs retrieved successfully', { jobs, count: jobs.length });
    } catch (error) {
      next(error);
    }
  }

  static async updateJob(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const job = await JobService.updateJob(req.params.id, req.user!.id, req.user!.role, req.body);
      ResponseHandler.success(res, 'Job updated successfully', { job });
    } catch (error) {
      next(error);
    }
  }

  static async deleteJob(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await JobService.deleteJob(req.params.id, req.user!.id, req.user!.role);
      ResponseHandler.success(res, 'Job deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
