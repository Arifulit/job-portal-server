import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ResponseHandler } from '@/app/utils/response';
import { AuthenticatedRequest } from '@/app/types';
import {
  ConflictError,
  ValidationError,
  UnauthorizedError,
  NotFoundError,
} from '@/app/utils/errors';
import { logger } from '@/app/utils/logger';
import { catchAsync } from '@/app/utils/catchAsync';

const register = catchAsync(async (req: Request, res: Response) => {
  try {
    const { email, password, full_name } = req.body ?? {};
    if (!email || !password || !full_name) {
      ResponseHandler.error(res, 'email, password and full_name are required', 400);
      return;
    }

    const result = await AuthService.register(req.body);
    ResponseHandler.created(res, 'User registered successfully', result);
    return;
  } catch (error: any) {
    logger.error('AuthController.register error', { message: error?.message, stack: error?.stack });

    if (error instanceof ConflictError) {
      ResponseHandler.error(res, error.message, 409);
      return;
    }
    if (error instanceof ValidationError) {
      ResponseHandler.error(res, error.message, 400);
      return;
    }
    if (error instanceof UnauthorizedError) {
      ResponseHandler.error(res, error.message, 401);
      return;
    }
    if (error instanceof NotFoundError) {
      ResponseHandler.error(res, error.message, 404);
      return;
    }

    const msg =
      process.env.NODE_ENV === 'development' ? (error?.message || 'Internal error') : 'An unexpected error occurred';
    ResponseHandler.error(res, msg, 500);
    return;
  }
});

const login = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.login(req.body);
  ResponseHandler.success(res, 'Login successful', result);
  return;
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.body ?? {};
  const result = await AuthService.refreshAccessToken(refreshToken);
  ResponseHandler.success(res, 'Token refreshed successfully', result);
  return;
});

const logout = catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user || !authReq.user.id) {
    ResponseHandler.error(res, 'Unauthorized', 401);
    return;
  }

  const { refreshToken } = req.body ?? {};
  await AuthService.logout(authReq.user.id, refreshToken);
  ResponseHandler.success(res, 'Logged out successfully');
  return;
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user || !authReq.user.id) {
    ResponseHandler.error(res, 'Unauthorized', 401);
    return;
  }

  const { oldPassword, newPassword } = req.body ?? {};
  await AuthService.changePassword(authReq.user.id, oldPassword, newPassword);
  ResponseHandler.success(res, 'Password changed successfully');
  return;
});

// ...existing imports...
const getProfile = catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user || !authReq.user.id) {
    ResponseHandler.error(res, 'Unauthorized', 401);
    return;
  }

  // load full user from DB (exclude password)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mongoose = require('mongoose');
  const UserModel = mongoose.models.User || require('../user/user.model').default;

  const userId = authReq.user.id;
  let user = await UserModel.findOne({ id: userId }).select('-password_hash -__v').lean().exec();
  if (!user && mongoose.Types.ObjectId.isValid(userId)) {
    user = await UserModel.findById(userId).select('-password_hash -__v').lean().exec();
  }

  if (!user) {
    ResponseHandler.error(res, 'User not found', 404);
    return;
  }

  ResponseHandler.success(res, 'Profile retrieved successfully', { user });
  return;
});

export const AuthController = {
  register,
  login,
  refreshToken,
  logout,
  changePassword,
  getProfile,
};

