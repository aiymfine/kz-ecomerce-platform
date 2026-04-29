import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  DATABASE_POOL_SIZE: z.coerce.number().default(20),
  REDIS_URL: z.string().min(1),
  JWT_SECRET_KEY: z.string().min(32),
  JWT_ALGORITHM: z.string().default('HS256'),
  JWT_ACCESS_TOKEN_EXPIRE_MINUTES: z.coerce.number().default(30),
  JWT_REFRESH_TOKEN_EXPIRE_DAYS: z.coerce.number().default(7),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
});

export type EnvConfig = z.infer<typeof envSchema>;
