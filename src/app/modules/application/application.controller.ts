import { Response, NextFunction } from 'express';
import { ApplicationService } from './application.service';
import { ResponseHandler } from '@/app/utils/response';
import { AuthenticatedRequest } from '@/app/types';

export class ApplicationController {
  static async applyForJob(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const application = await ApplicationService.applyForJob(
        req.params.jobId,
        req.user!.id,
        req.body
      );
      ResponseHandler.created(res, 'Application submitted successfully', { application });
    } catch (error) {
      next(error);
    }
  }

  static async getApplicationsByJob(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const applications = await ApplicationService.getApplicationsByJob(
        req.params.jobId,
        req.user!.id,
        req.user!.role
      );
      ResponseHandler.success(res, 'Applications retrieved successfully', {
        applications,
        count: applications.length,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyApplications(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const applications = await ApplicationService.getMyApplications(req.user!.id);
      ResponseHandler.success(res, 'Applications retrieved successfully', {
        applications,
        count: applications.length,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateApplicationStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.body;
      const application = await ApplicationService.updateApplicationStatus(
        req.params.id,
        status,
        req.user!.id,
        req.user!.role
      );
      ResponseHandler.success(res, 'Application status updated successfully', { application });
    } catch (error) {
      next(error);
    }
  }

  static async deleteApplication(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await ApplicationService.deleteApplication(req.params.id, req.user!.id);
      ResponseHandler.success(res, 'Application deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
