import { Request, Response, NextFunction } from 'express';
import { ApplicationService } from './application.service';
import { ResponseHandler } from '@/app/utils/response';
import { AuthenticatedRequest } from '@/app/types';
import { catchAsync } from '@/app/utils/catchAsync';

// Apply for a job
const applyForJob = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.user?.id) {
    ResponseHandler.error(res, 'Unauthorized', 401);
    return;
  }

  const jobId = req.params.jobId;
  if (!jobId) {
    ResponseHandler.error(res, 'Job ID is required', 400);
    return;
  }

  const { resume_url, cover_letter } = req.body;
  if (!resume_url) {
    ResponseHandler.error(res, 'resume_url is required', 400);
    return;
  }

  const application = await ApplicationService.applyForJob(
    jobId, 
    authReq.user.id, 
    { resume_url, cover_letter }
  );
  
  ResponseHandler.created(res, 'Application submitted successfully', { application });
});

// Get all applications for a specific job (employer/recruiter/admin only)
const getApplicationsByJob = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  
  if (!authReq.user?.id) {
    ResponseHandler.error(res, 'Unauthorized', 401);
    return;
  }

  const jobId = req.params.jobId;
  if (!jobId) {
    ResponseHandler.error(res, 'Job ID is required', 400);
    return;
  }

  const applications = await ApplicationService.getApplicationsByJob(
    jobId,
    authReq.user.id,
    authReq.user.role
  );
  
  ResponseHandler.success(res, 'Applications retrieved successfully', {
    applications,
    count: applications.length,
  });
});

// Get my applications (job seeker)
const getMyApplications = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  
  if (!authReq.user?.id) {
    ResponseHandler.error(res, 'Unauthorized', 401);
    return;
  }

  const applications = await ApplicationService.getMyApplications(authReq.user.id);
  
  ResponseHandler.success(res, 'Applications retrieved successfully', {
    applications,
    count: applications.length,
  });
});

// Update application status (employer/recruiter/admin only)
const updateApplicationStatus = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  
  if (!authReq.user?.id) {
    ResponseHandler.error(res, 'Unauthorized', 401);
    return;
  }

  const applicationId = req.params.id;
  const { status } = req.body;

  if (!applicationId) {
    ResponseHandler.error(res, 'Application ID is required', 400);
    return;
  }
  
  if (!status) {
    ResponseHandler.error(res, 'Status is required', 400);
    return;
  }

  const application = await ApplicationService.updateApplicationStatus(
    applicationId,
    status,
    authReq.user.id,
    authReq.user.role
  );
  
  ResponseHandler.success(res, 'Application status updated successfully', { application });
});

// Delete an application (job seeker only)
const deleteApplication = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  
  if (!authReq.user?.id) {
    ResponseHandler.error(res, 'Unauthorized', 401);
    return;
  }

  const applicationId = req.params.id;
  if (!applicationId) {
    ResponseHandler.error(res, 'Application ID is required', 400);
    return;
  }

  await ApplicationService.deleteApplication(applicationId, authReq.user.id);
  
  ResponseHandler.success(res, 'Application deleted successfully');
});

export const ApplicationController = {
  applyForJob,
  getApplicationsByJob,
  getMyApplications,
  updateApplicationStatus,
  deleteApplication,
};