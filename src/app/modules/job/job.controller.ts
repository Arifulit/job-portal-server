import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { JobService } from './job.service';
import { AuthenticatedRequest } from '@/app/types';
import { logger } from '@/app/utils/logger';
import { catchAsync } from '@/app/utils/catchAsync';
import { sendResponse } from '@/app/utils/sendResponse';


  const createJob = catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return sendResponse(res, {
        success: false, statusCode: StatusCodes.UNAUTHORIZED, message: 'Authentication required',
        data: undefined
      });
    }
    const job = await JobService.createJob(authReq.user.id, req.body);
    return sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: 'Job created successfully',
      data: job,
    });
  });

  const getAllJobs = catchAsync(async (req: Request, res: Response) => {
    const jobs = await JobService.getAllJobs(req.query);
    return sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Jobs retrieved successfully',
      data: jobs,
      meta: { count: Array.isArray(jobs) ? jobs.length : 0 },
    });
  });


  const getJobById = catchAsync(async (req: Request, res: Response) => {
    const job = await JobService.getJobById(req.params.id);
    return sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Job retrieved successfully',
      data: job,
    });
  });

  const getMyJobs = catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return sendResponse(res, {
        success: false, statusCode: StatusCodes.UNAUTHORIZED, message: 'Authentication required',
        data: undefined
      });
    }
    const jobs = await JobService.getEmployerJobs(authReq.user.id);
    return sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Jobs retrieved successfully',
      data: jobs,
      meta: { count: Array.isArray(jobs) ? jobs.length : 0 },
    });
  });
  
  const updateJob = catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return sendResponse(res, {
        success: false, statusCode: StatusCodes.UNAUTHORIZED, message: 'Authentication required',
        data: undefined
      });
    }
    const updatedJob = await JobService.updateJob(req.params.id, authReq.user.id, authReq.user.role, req.body);
    return sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Job updated successfully',
      data: updatedJob,
    });
  });

  
  const  deleteJob = catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return sendResponse(res, {
        success: false, statusCode: StatusCodes.UNAUTHORIZED, message: 'Authentication required',
        data: undefined
      });
    }
    const result = await JobService.deleteJob(req.params.id, authReq.user.id, authReq.user.role);
    return sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Job deleted successfully',
      data: result,
    });
  });
     

  export const JobController = {
    createJob,
    getAllJobs,
    getJobById,
    getMyJobs,
    updateJob,
    deleteJob
}