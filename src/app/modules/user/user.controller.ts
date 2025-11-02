// ...existing code...
import { Request, Response } from 'express';
import { UserService } from './user.service';
import { ResponseHandler } from '@/app/utils/response';
import { AuthenticatedRequest } from '@/app/types';
import { catchAsync } from '@/app/utils/catchAsync';

// ...existing code...
const getProfile = catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user || !authReq.user.id) {
    ResponseHandler.error(res, 'Unauthorized', 401);
    return;
  }

  const user = await UserService.getUserById(authReq.user.id);
  ResponseHandler.success(res, 'Profile retrieved successfully', { user });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user || !authReq.user.id) {
    ResponseHandler.error(res, 'Unauthorized', 401);
    return;
  }

  const updatedUser = await UserService.updateProfile(authReq.user.id, req.body);
  ResponseHandler.success(res, 'Profile updated successfully', { user: updatedUser });
});

const deleteAccount = catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user || !authReq.user.id) {
    ResponseHandler.error(res, 'Unauthorized', 401);
    return;
  }

  await UserService.deleteAccount(authReq.user.id);
  ResponseHandler.success(res, 'Account deleted successfully');
});

export const UserController = {
  getProfile,
  updateProfile,
  deleteAccount,
};
// ...existing code...