import { Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { ResponseHandler } from '@/app/utils/response';
import { AuthenticatedRequest } from '@/app/types';
import { Request } from 'express';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.register(req.body);
      ResponseHandler.created(res, 'User registered successfully', result);
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.login(req.body);
      ResponseHandler.success(res, 'Login successful', result);
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refreshAccessToken(refreshToken);
      ResponseHandler.success(res, 'Token refreshed successfully', result);
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      await AuthService.logout(req.user!.id, refreshToken);
      ResponseHandler.success(res, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { oldPassword, newPassword } = req.body;
      await AuthService.changePassword(req.user!.id, oldPassword, newPassword);
      ResponseHandler.success(res, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      ResponseHandler.success(res, 'Profile retrieved successfully', { user: req.user });
    } catch (error) {
      next(error);
    }
  }
}
