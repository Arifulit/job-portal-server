// ...existing code...
import { Request, Response, NextFunction } from 'express';
import { ApplicationService } from './application.service';
import { ResponseHandler } from '@/app/utils/response';
import { AuthenticatedRequest } from '@/app/types';
import { catchAsync } from '@/app/utils/catchAsync';

const applyForJob = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user || !authReq.user.id) {
    ResponseHandler.error(res, 'Unauthorized', 401);
    return;
  }

  const jobId = req.params.jobId;
  const application = await ApplicationService.applyForJob(jobId, authReq.user.id, req.body);
  ResponseHandler.created(res, 'Application submitted successfully', { application });
});

const getApplicationsByJob = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user || !authReq.user.id) {
    ResponseHandler.error(res, 'Unauthorized', 401);
    return;
  }

  const jobId = req.params.jobId;
  const applications = await ApplicationService.getApplicationsByJob(jobId, authReq.user.id, authReq.user.role);
  ResponseHandler.success(res, 'Applications retrieved successfully', {
    applications,
    count: Array.isArray(applications) ? applications.length : 0,
  });
});

const getMyApplications = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user || !authReq.user.id) {
    ResponseHandler.error(res, 'Unauthorized', 401);
    return;
  }

  const applications = await ApplicationService.getMyApplications(authReq.user.id);
  ResponseHandler.success(res, 'Applications retrieved successfully', {
    applications,
    count: Array.isArray(applications) ? applications.length : 0,
  });
});

const updateApplicationStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user || !authReq.user.id) {
    ResponseHandler.error(res, 'Unauthorized', 401);
    return;
  }

  const { status } = req.body;
  const application = await ApplicationService.updateApplicationStatus(
    req.params.id,
    status,
    authReq.user.id,
    authReq.user.role
  );
  ResponseHandler.success(res, 'Application status updated successfully', { application });
});

const deleteApplication = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user || !authReq.user.id) {
    ResponseHandler.error(res, 'Unauthorized', 401);
    return;
  }

  await ApplicationService.deleteApplication(req.params.id, authReq.user.id);
  ResponseHandler.success(res, 'Application deleted successfully');
});

export const ApplicationController = {
  applyForJob,
  getApplicationsByJob,
  getMyApplications,
  updateApplicationStatus,
  deleteApplication,
};
// ...existing code...