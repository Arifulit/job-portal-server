import { Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { ResponseHandler } from '@/app/utils/response';
import { AuthenticatedRequest } from '@/app/types';

export class UserController {
  static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await UserService.getUserById(req.user!.id);
      ResponseHandler.success(res, 'Profile retrieved successfully', { user });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const updatedUser = await UserService.updateProfile(req.user!.id, req.body);
      ResponseHandler.success(res, 'Profile updated successfully', { user: updatedUser });
    } catch (error) {
      next(error);
    }
  }

  static async deleteAccount(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await UserService.deleteAccount(req.user!.id);
      ResponseHandler.success(res, 'Account deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
