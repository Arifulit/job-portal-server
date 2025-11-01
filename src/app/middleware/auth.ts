// import { Response, NextFunction } from 'express';
// import { AuthenticatedRequest, UserRole } from '@/app/types';
// import { JWTService } from '@/app/utils/jwt';
// import { UnauthorizedError, ForbiddenError } from '@/app/utils/errors';

// export const authenticate = async (
//   req: AuthenticatedRequest,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const authHeader = req.headers.authorization;

//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       throw new UnauthorizedError('No token provided');
//     }

//     const token = authHeader.substring(7);
//     const payload = JWTService.verifyAccessToken(token);

//     req.user = {
//       id: payload.userId,
//       email: payload.email,
//       role: payload.role,
//     };

//     next();
//   } catch (error) {
//     next(error);
//   }
// };

// export const authorize = (...allowedRoles: UserRole[]) => {
//   return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
//     try {
//       if (!req.user) {
//         throw new UnauthorizedError('User not authenticated');
//       }

//       if (!allowedRoles.includes(req.user.role)) {
//         throw new ForbiddenError(
//           `Access denied. Required roles: ${allowedRoles.join(', ')}`
//         );
//       }

//       next();
//     } catch (error) {
//       next(error);
//     }
//   };
// };
// ...existing code...
import { Request, Response, NextFunction } from 'express';
import { JWTService } from '@/app/utils/jwt';
// import UserModel from '@/app/models/user.model';
import { UnauthorizedError } from '@/app/utils/errors';
import { UserRole } from '@/app/types';
import UserModel from '../modules/user/user.model';

export interface AuthenticatedRequest extends Request {
  user?: { id: string; email?: string; role?: string };
}

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = String(req.headers.authorization || '');
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authorization token required' });
    }

    const token = authHeader.slice(7).trim();
    const payload: any = JWTService.verifyAccessToken(token);

    const userId = payload.sub ?? payload.userId;
    if (!userId) throw new UnauthorizedError('Invalid token payload');

    const user = await UserModel.findById(userId).lean().exec();
    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }

    req.user = { id: user._id.toString(), email: user.email, role: user.role };
    return next();
  } catch (err: any) {
    return res.status(401).json({ success: false, message: err?.message || 'Unauthorized' });
  }
}

export function authorize(...allowedRoles: (UserRole | string)[]) {
  const allowed = allowedRoles.map(r => String(r).toLowerCase());
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    console.info('authorize: req.user=', req.user, 'allowed=', allowed); // debug (remove in prod)
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    const role = String(req.user.role || '').toLowerCase();
    if (!role || !allowed.includes(role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    return next();
  };
}
// ...existing code...