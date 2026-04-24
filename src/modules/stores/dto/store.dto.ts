import { z } from 'zod';

export const createStoreSchema = z.object({
  name: z.string().min(1, 'Store name is required').max(255),
  subdomain: z
    .string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(63)
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Invalid subdomain format'),
  customDomain: z.string().max(255).optional(),
  timezone: z.string().max(50).default('Asia/Almaty'),
  currency: z.string().max(3).default('KZT'),
  vatRate: z.number().int().min(0).max(30).default(12),
});

export type CreateStoreDto = z.infer<typeof createStoreSchema>;

export const updateStoreSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  customDomain: z.string().max(255).nullable().optional(),
  timezone: z.string().max(50).optional(),
  currency: z.string().max(3).optional(),
  vatRate: z.number().int().min(0).max(30).optional(),
  isLive: z.boolean().optional(),
});

export type UpdateStoreDto = z.infer<typeof updateStoreSchema>;
