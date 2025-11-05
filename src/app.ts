
import 'dotenv/config';
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import apiRouter from './app/routes';
import { errorHandler, notFoundHandler } from './app/middleware/errorHandler';

const app: Application = express();

// Security
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Rate limiting for API v1
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  message: { error: 'Too many requests from this IP, try again later.' },
});
app.use('/api/v1', limiter);

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Handle malformed JSON body errors from express.json
// must be four-arg error handler so express treats it as error middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const isEntityParseFailed = err && err.type === 'entity.parse.failed';
  const isSyntaxError = err instanceof SyntaxError && 'body' in err;
  const isEmptyBodyError = err && typeof err.message === 'string' && /Unexpected end of JSON input/i.test(err.message);
  const safeMethods = ['GET', 'HEAD', 'DELETE'];

  if ((isEntityParseFailed || isSyntaxError) && isEmptyBodyError && safeMethods.includes(req.method)) {
    (req as any).body = {};
    return next();
  }

  if (isEntityParseFailed) {
    return res.status(400).json({
      success: false,
      message: 'Malformed JSON body',
      errors: err.message,
      timestamp: new Date().toISOString(),
    });
  }

  if (isSyntaxError) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON payload',
      errors: err.message,
      timestamp: new Date().toISOString(),
    });
  }

  next(err);
});

// Health & root
app.get('/', (_req: Request, res: Response) =>
  res.json({ message: `${process.env.APP_NAME || 'Job Portal API'} root route working!` })
);

app.get('/health', (_req: Request, res: Response) =>
  res.status(200).json({
    success: true,
    message: `${process.env.APP_NAME || 'Job Portal API'} is running successfully`,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  })
);

// Mount API router
app.use('/api/v1', apiRouter);

// Error handlers (404 + global)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;