
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ResponseHandler } from '@/app/utils/response';
import { catchAsync } from '@/app/utils/catchAsync';
import { ValidationError } from '@/app/utils/errors';
import { logger } from '@/app/utils/logger';

// Mongoose models (use existing compiled models if present)
const UserModel = mongoose.models.User || require('../user/user.model').default;
const JobModel = mongoose.models.Job || require('../job/job.model').default;
const ApplicationModel = mongoose.models.Application || require('../application/application.model').default;

const getAllUsers = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const { role, is_active, q, limit = '50', page = '1' } = req.query as any;

    const filter: any = {};
    if (role) filter.role = role;
    if (typeof is_active !== 'undefined') filter.is_active = String(is_active) === 'true';
    if (q) {
      const regex = new RegExp(String(q).trim(), 'i');
      filter.$or = [{ full_name: regex }, { email: regex }, { company_name: regex }, { phone: regex }];
    }

    const l = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (p - 1) * l;

    const [users, total] = await Promise.all([
      UserModel.find(filter).select('-password_hash').sort({ createdAt: -1 }).skip(skip).limit(l).lean().exec(),
      UserModel.countDocuments(filter),
    ]);

    ResponseHandler.success(res, 'Users retrieved successfully', {
      users,
      meta: { total, page: p, limit: l },
    });
  } catch (err: any) {
    logger.error('AdminController.getAllUsers error', err);
    throw new ValidationError('Failed to fetch users');
  }
});

const updateUserStatus = catchAsync(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  const { isActive } = req.body as { isActive?: boolean };
  if (typeof isActive === 'undefined') {
    ResponseHandler.error(res, 'isActive is required', 400);
    return;
  }

  const userId = req.params.userId;
  if (!userId) {
    ResponseHandler.error(res, 'User ID is required', 400);
    return;
  }

  const updated = await UserModel.findByIdAndUpdate(
    userId,
    { is_active: Boolean(isActive), updatedAt: new Date() },
    { new: true }
  )
    .select('-password_hash')
    .lean()
    .exec();

  if (!updated) {
    ResponseHandler.error(res, 'User not found', 404);
    return;
  }

  ResponseHandler.success(res, 'User updated successfully', { user: updated });
});

const deleteUser = catchAsync(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  const userId = req.params.userId;
  if (!userId) {
    ResponseHandler.error(res, 'User ID is required', 400);
    return;
  }

  const deleted = await UserModel.findByIdAndDelete(userId).lean().exec();
  if (!deleted) {
    ResponseHandler.error(res, 'User not found', 404);
    return;
  }

  ResponseHandler.success(res, 'User deleted successfully', { user: deleted });
});

const getDashboardStats = catchAsync(async (_req: Request, res: Response, _next: NextFunction) => {
  try {
    const [usersCount, jobsCount, activeJobsCount, applicationsCount] = await Promise.all([
      UserModel.countDocuments({}),
      JobModel.countDocuments({}),
      JobModel.countDocuments({ status: 'active' }),
      ApplicationModel.countDocuments({}),
    ]);

    const stats = {
      users: usersCount,
      jobs: jobsCount,
      active_jobs: activeJobsCount,
      applications: applicationsCount,
    };

    ResponseHandler.success(res, 'Dashboard stats retrieved successfully', stats);
  } catch (err: any) {
    logger.error('AdminController.getDashboardStats error', err);
    throw new ValidationError('Failed to fetch dashboard stats');
  }
});

const getAllJobs = catchAsync(async (_req: Request, res: Response, _next: NextFunction) => {
  const { limit = '50', page = '1', status, q } = _req.query as any;
  try {
    const filter: any = {};
    if (status) filter.status = status;
    if (q) {
      const regex = new RegExp(String(q).trim(), 'i');
      filter.$or = [{ title: regex }, { description: regex }, { location: regex }];
    }

    const l = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (p - 1) * l;

    const [jobs, total] = await Promise.all([
      JobModel.find(filter).sort({ created_at: -1 }).skip(skip).limit(l).lean().exec(),
      JobModel.countDocuments(filter),
    ]);

    ResponseHandler.success(res, 'Jobs retrieved successfully', { jobs, meta: { total, page: p, limit: l } });
  } catch (err: any) {
    logger.error('AdminController.getAllJobs error', err);
    throw new ValidationError('Failed to fetch jobs');
  }
});

const getAllApplications = catchAsync(async (_req: Request, res: Response, _next: NextFunction) => {
  try {
    const applications = await ApplicationModel.find({}).sort({ applied_at: -1 }).lean().exec();
    ResponseHandler.success(res, 'Applications retrieved successfully', {
      applications,
      count: Array.isArray(applications) ? applications.length : 0,
    });
  } catch (err: any) {
    logger.error('AdminController.getAllApplications error', err);
    throw new ValidationError('Failed to fetch applications');
  }
});

export const AdminController = {
  getAllUsers,
  updateUserStatus,
  deleteUser,
  getDashboardStats,
  getAllJobs,
  getAllApplications,
};