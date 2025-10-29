// ...existing code...
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform((v) => Number(v)).default('5000'),

  // MongoDB
  MONGODB_URI: z.string().min(1),

  // JWT (keeps compatibility with existing .env keys)
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  // support both EXPIRES and EXPIRY naming if present
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),
  JWT_ACCESS_EXPIRY: z.string().optional(),
  JWT_REFRESH_EXPIRY: z.string().optional(),

  // Bcrypt / salt rounds
  BCRYPT_SALT_ROUND: z.string().transform((v) => Number(v)).default('10'),

  // Frontend / CORS
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  CORS_ORIGIN: z.string().optional(),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform((v) => Number(v)).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform((v) => Number(v)).default('100'),

  // Optional Redis config
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().transform((v) => Number(v)).optional(),
  REDIS_USERNAME: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

const parseEnv = () => {
  try {
    const parsed = envSchema.parse(process.env);

    // Prefer FRONTEND_URL but allow CORS_ORIGIN fallback
    const frontendUrl = parsed.FRONTEND_URL || parsed.CORS_ORIGIN || 'http://localhost:5173';

    return {
      ...parsed,
      FRONTEND_URL: frontendUrl,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

export const env = parseEnv();
// ...existing code...