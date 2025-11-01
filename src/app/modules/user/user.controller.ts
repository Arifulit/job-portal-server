// import { Response, NextFunction } from 'express';
// import { UserService } from './user.service';
// import { ResponseHandler } from '@/app/utils/response';
// import { AuthenticatedRequest } from '@/app/types';

// export class UserController {
//   static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
//     try {
//       const user = await UserService.getUserById(req.user!.id);
//       ResponseHandler.success(res, 'Profile retrieved successfully', { user });
//     } catch (error) {
//       next(error);
//     }
//   }

//   static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
//     try {
//       const updatedUser = await UserService.updateProfile(req.user!.id, req.body);
//       ResponseHandler.success(res, 'Profile updated successfully', { user: updatedUser });
//     } catch (error) {
//       next(error);
//     }
//   }

//   static async deleteAccount(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
//     try {
//       await UserService.deleteAccount(req.user!.id);
//       ResponseHandler.success(res, 'Account deleted successfully');
//     } catch (error) {
//       next(error);
//     }
//   }
// }

// ...existing code...
import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { ResponseHandler } from '@/app/utils/response';
import { AuthenticatedRequest } from '@/app/types';

export class UserController {


  static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      console.info('getProfile called', { user: req.user }); // temporary debug
      if (!req.user || !req.user.id) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const user = await UserService.getUserById(req.user.id);
      ResponseHandler.success(res, 'Profile retrieved successfully', { user });
    } catch (error: any) {
      console.error('UserController.getProfile error:', error);
      // return detailed message in development for faster debugging
      if (process.env.NODE_ENV === 'development') {
        res.status(500).json({ success: false, message: error?.message || 'Internal error', stack: error?.stack });
        return;
      }
      next(error);
    }
  }



  static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const updatedUser = await UserService.updateProfile(req.user.id, req.body);
      ResponseHandler.success(res, 'Profile updated successfully', { user: updatedUser });
    } catch (error: any) {
      console.error('UserController.updateProfile error:', error);
      next(error);
    }
  }
  static async deleteAccount(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      await UserService.deleteAccount(req.user.id);
      ResponseHandler.success(res, 'Account deleted successfully');
    } catch (error: any) {
      console.error('UserController.deleteAccount error:', error);
      next(error);
    }
  }
    }


// ...existing code...