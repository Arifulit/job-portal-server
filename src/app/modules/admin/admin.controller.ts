import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service';
import { ResponseHandler } from '@/app/utils/response';

export class AdminController {
  static async getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await AdminService.getAllUsers(req.query);
      ResponseHandler.success(res, 'Users retrieved successfully', { users, count: users.length });
    } catch (error) {
      next(error);
    }
  }

  static async updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { isActive } = req.body;
      const user = await AdminService.updateUserStatus(req.params.userId, isActive);
      ResponseHandler.success(res, 'User status updated successfully', { user });
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AdminService.deleteUser(req.params.userId);
      ResponseHandler.success(res, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await AdminService.getDashboardStats();
      ResponseHandler.success(res, 'Dashboard stats retrieved successfully', stats);
    } catch (error) {
      next(error);
    }
  }

  static async getAllJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const jobs = await AdminService.getAllJobs();
      ResponseHandler.success(res, 'Jobs retrieved successfully', { jobs, count: jobs.length });
    } catch (error) {
      next(error);
    }
  }

  static async getAllApplications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const applications = await AdminService.getAllApplications();
      ResponseHandler.success(res, 'Applications retrieved successfully', {
        applications,
        count: applications.length,
      });
    } catch (error) {
      next(error);
    }
  }
}
