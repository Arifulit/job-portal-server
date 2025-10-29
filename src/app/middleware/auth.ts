import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '@/app/types';
import { JWTService } from '@/app/utils/jwt';
import { UnauthorizedError, ForbiddenError } from '@/app/utils/errors';

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);
    const payload = JWTService.verifyAccessToken(token);

    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError(
          `Access denied. Required roles: ${allowedRoles.join(', ')}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
