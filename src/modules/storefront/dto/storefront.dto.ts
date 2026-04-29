import { z } from 'zod';

export const customerRegisterSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
});

export type CustomerRegisterDto = z.infer<typeof customerRegisterSchema>;

export const customerLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export type CustomerLoginDto = z.infer<typeof customerLoginSchema>;

export const storefrontRefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type StorefrontRefreshTokenDto = z.infer<typeof storefrontRefreshTokenSchema>;

export const storefrontProductFilterSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  categoryId: z.coerce.number().int().optional(),
});

export type StorefrontProductFilterDto = z.infer<typeof storefrontProductFilterSchema>;
