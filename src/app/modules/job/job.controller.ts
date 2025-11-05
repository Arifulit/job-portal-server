
import { Request, Response, NextFunction } from 'express';
import { JobService } from './job.service';
import { ResponseHandler } from '@/app/utils/response';
import { AuthenticatedRequest } from '@/app/types';
import { catchAsync } from '@/app/utils/catchAsync';

const createJob = catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user?.id) {
    ResponseHandler.error(res, 'Authentication required', 401);
    return;
  }
  const job = await JobService.createJob(authReq.user.id, req.body);
  ResponseHandler.created(res, 'Job created successfully', job);
});

const getAllJobs = catchAsync(async (req: Request, res: Response) => {
  const filters = req.query as any;
  const jobs = await JobService.getAllJobs(filters);
  ResponseHandler.success(res, 'Jobs retrieved successfully', { jobs, count: Array.isArray(jobs) ? jobs.length : 0 });
});

const getJobById = catchAsync(async (req: Request, res: Response) => {
  const job = await JobService.getJobById(req.params.id);
  if (!job) {
    ResponseHandler.error(res, 'Job not found', 404);
    return;
  }
  ResponseHandler.success(res, 'Job retrieved successfully', job);
});

const getMyJobs = catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user?.id) {
    ResponseHandler.error(res, 'Authentication required', 401);
    return;
  }
  const jobs = await JobService.getEmployerJobs(authReq.user.id);
  ResponseHandler.success(res, 'Jobs retrieved successfully', { jobs, count: Array.isArray(jobs) ? jobs.length : 0 });
});

const updateJob = catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user?.id) {
    ResponseHandler.error(res, 'Authentication required', 401);
    return;
  }
  const updated = await JobService.updateJob(req.params.id, authReq.user.id, authReq.user.role, req.body);
  if (!updated) {
    ResponseHandler.error(res, 'Job not found or not permitted', 404);
    return;
  }
  ResponseHandler.success(res, 'Job updated successfully', updated);
});

const deleteJob = catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user?.id) {
    ResponseHandler.error(res, 'Authentication required', 401);
    return;
  }
  const result = await JobService.deleteJob(req.params.id, authReq.user.id, authReq.user.role);
  ResponseHandler.success(res, 'Job deleted successfully', result);
});

export const JobController = {
  createJob,
  getAllJobs,
  getJobById,
  getMyJobs,
  updateJob,
  deleteJob,
};
