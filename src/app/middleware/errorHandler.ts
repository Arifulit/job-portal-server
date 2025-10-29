import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/app/utils/errors';
import { logger } from '@/app/utils/logger';
import { ResponseHandler } from '@/app/utils/response';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  if (err instanceof AppError) {
    logger.warn(`[${err.statusCode}] ${err.message}`, {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });

    return ResponseHandler.error(res, err.message, err.statusCode);
  }

  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    logger.warn(`Validation error: ${errors}`, {
      path: req.path,
      method: req.method,
    });

    return ResponseHandler.error(res, 'Validation failed', 400, errors);
  }

  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  return ResponseHandler.serverError(res, 'An unexpected error occurred');
};

export const notFoundHandler = (req: Request, res: Response): Response => {
  return ResponseHandler.notFound(res, `Cannot ${req.method} ${req.path}`);
};
