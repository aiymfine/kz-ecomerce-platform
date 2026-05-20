import { z } from 'zod';

// Helper: coerce empty strings to undefined so defaults kick in
const optionalCoerceNumber = z.preprocess(
  (v) => (v === '' || v === undefined ? undefined : Number(v)),
  z.number(),
);

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  DATABASE_POOL_SIZE: z.coerce.number().default(20),
  REDIS_URL: z.string().min(1).optional(),
  JWT_SECRET_KEY: z.string().min(1, 'JWT_SECRET_KEY is required'),
  JWT_ALGORITHM: z.string().default('HS256'),
  JWT_ACCESS_TOKEN_EXPIRE_MINUTES: optionalCoerceNumber.default(30),
  JWT_REFRESH_TOKEN_EXPIRE_DAYS: optionalCoerceNumber.default(7),
  CORS_ORIGINS: z.string().default('*'),
  SMTP_HOST: z.string().min(1).default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default(''),
  SMTP_PASSWORD: z.string().default(''),
  SMTP_FROM: z.string().optional().default(''),
  // Optional: used for email links (password reset, etc.)
  APP_URL: z.string().default('http://localhost:3000'),
  // Optional: payment provider keys
  KASPI_PAY_MERCHANT_ID: z.string().optional(),
  KASPI_PAY_SECRET_KEY: z.string().optional(),
  HALYK_BANK_CLIENT_ID: z.string().optional(),
  HALYK_BANK_CLIENT_SECRET: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;
