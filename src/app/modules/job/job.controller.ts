
import { Request, Response } from 'express';
import { ResponseHandler } from '@/app/utils/response';
import { AuthenticatedRequest } from '@/app/types';
import { catchAsync } from '@/app/utils/catchAsync';
import { JobService } from './job.service';

export const JobController = {
  createJob: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user?.id) {
      ResponseHandler.error(res, 'Authentication required', 401);
      return;
    }

    const job = await JobService.createJob(authReq.user.id, req.body);
    ResponseHandler.created(res, 'Job created successfully', job);
  }),

  getAllJobs: catchAsync(async (req: Request, res: Response) => {
    const jobs = await JobService.getAllJobs(req.query);
    ResponseHandler.success(res, 'Jobs retrieved successfully', { jobs, count: jobs.length });
  }),

  getJobById: catchAsync(async (req: Request, res: Response) => {
    const job = await JobService.getJobById(req.params.id);
    ResponseHandler.success(res, 'Job retrieved successfully', job);
  }),

  getMyJobs: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user?.id) {
      ResponseHandler.error(res, 'Authentication required', 401);
      return;
    }

    const jobs = await JobService.getEmployerJobs(authReq.user.id);
    ResponseHandler.success(res, 'Jobs retrieved successfully', { jobs, count: jobs.length });
  }),

  updateJob: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user?.id) {
      ResponseHandler.error(res, 'Authentication required', 401);
      return;
    }

    const updated = await JobService.updateJob(
      req.params.id,
      authReq.user.id,
      authReq.user.role,
      req.body
    );
    ResponseHandler.success(res, 'Job updated successfully', updated);
  }),

  deleteJob: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user?.id) {
      ResponseHandler.error(res, 'Authentication required', 401);
      return;
    }

    const result = await JobService.deleteJob(req.params.id, authReq.user.id, authReq.user.role);
    ResponseHandler.success(res, 'Job deleted successfully', result);
  }),
};
