// ...existing code...
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().transform((v) => Number(v)).default("5000"),

  // required for MongoDB
  MONGODB_URI: z.string().min(1),

  // required for JWT
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),

  // optional but validated
  FRONTEND_URL: z.string().url().optional(),
  REDIS_HOST: z.string().optional(),
});

export function validateEnv(): void {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Environment validation failed:");
    for (const err of result.error.errors) {
      console.error(`  - ${err.path.join(".")}: ${err.message}`);
    }
    process.exit(1);
  }

  const cfg = result.data;
  // Minimal non-sensitive info for startup logs
  console.info(`✅ Environment validated — NODE_ENV=${cfg.NODE_ENV}, PORT=${cfg.PORT}`);
  console.info(`✅ MONGODB_URI is set`);
  if (cfg.REDIS_HOST) console.info(`ℹ️  Redis configured (host=${cfg.REDIS_HOST})`);
}
// ...existing code...