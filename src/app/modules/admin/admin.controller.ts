import { Request, Response } from 'express';
import { AdminService } from './admin.service';
import { ResponseHandler } from '@/app/utils/response';
import { catchAsync } from '@/app/utils/catchAsync';
import { ValidationError } from '@/app/utils/errors';
import { logger } from '@/app/utils/logger';
import { getDatabase } from '@/app/config/database';

// const getAllUsers = catchAsync(async (req: Request, res: Response) => {
//   const users = await AdminService.getAllUsers(req.query);
//   ResponseHandler.success(res, 'Users retrieved successfully', {
//     users,
//     count: Array.isArray(users) ? users.length : 0,
//   });
// });
const getAllUsers = async (filters?: any) => {
  const db = getDatabase() as any; // moved inside function
  try {
    return await db.collection('users').find(filters || {}).toArray();
  } catch (err: any) {
    logger.error('getAllUsers failed', err);
    throw new ValidationError('Failed to fetch users');
  }
};

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const { isActive } = req.body;
  const user = await AdminService.updateUserStatus(req.params.userId, isActive);
  ResponseHandler.success(res, 'User status updated successfully', { user });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  await AdminService.deleteUser(req.params.userId);
  ResponseHandler.success(res, 'User deleted successfully');
});

const getDashboardStats = catchAsync(async (_req: Request, res: Response) => {
  const stats = await AdminService.getDashboardStats();
  ResponseHandler.success(res, 'Dashboard stats retrieved successfully', stats);
});

const getAllJobs = catchAsync(async (_req: Request, res: Response) => {
  const jobs = await AdminService.getAllJobs();
  ResponseHandler.success(res, 'Jobs retrieved successfully', {
    jobs,
    count: Array.isArray(jobs) ? jobs.length : 0,
  });
});

const getAllApplications = catchAsync(async (_req: Request, res: Response) => {
  const applications = await AdminService.getAllApplications();
  ResponseHandler.success(res, 'Applications retrieved successfully', {
    applications,
    count: Array.isArray(applications) ? applications.length : 0,
  });
});

export const AdminController = {
  getAllUsers,
  updateUserStatus,
  deleteUser,
  getDashboardStats,
  getAllJobs,
  getAllApplications,
};