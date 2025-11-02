// ...existing code...
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { JWTService } from '@/app/utils/jwt';
// import UserModel from '@/app/models/user.model';
import { UnauthorizedError } from '@/app/utils/errors';
import { UserRole } from '@/app/types';
import UserModel from '../modules/user/user.model';

export type AuthenticatedRequest = Request & {
  user?: { id: string; email?: string; role?: string };
};

export const authenticate: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const authHeader = String(authReq.headers.authorization || '');
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authorization token required' });
    }

    const token = authHeader.slice(7).trim();
    const payload: any = JWTService.verifyAccessToken(token);

    const userId = payload.sub ?? payload.userId;
    if (!userId) throw new UnauthorizedError('Invalid token payload');

    const user = await UserModel.findById(userId).lean().exec() as any;
    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }

    authReq.user = { id: user._id.toString(), email: user.email, role: user.role };
    return next();
  } catch (err: any) {
    return res.status(401).json({ success: false, message: err?.message || 'Unauthorized' });
  }
};

export function authorize(...allowedRoles: (UserRole | string)[]): RequestHandler {
  const allowed = allowedRoles.map(r => String(r).toLowerCase());
  return (req, res, next) => {
    const authReq = req as AuthenticatedRequest;
    // console.info('authorize: req.user=', authReq.user, 'allowed=', allowed); // optional debug
    if (!authReq.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    const role = String(authReq.user.role || '').toLowerCase();
    if (!role || !allowed.includes(role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    return next();
  };
}
// ...existing code...