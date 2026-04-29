import { z } from 'zod';

export const createSubscriptionBoxSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  price_tiyin: z.number().int().min(100000),
  billing_cycle: z.enum(['weekly', 'bi_weekly', 'monthly']),
  max_skip_consecutive: z.number().int().min(1).default(2),
});

export const updateSubscriptionBoxSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  price_tiyin: z.number().int().min(100000).optional(),
  billing_cycle: z.enum(['weekly', 'bi_weekly', 'monthly']).optional(),
  max_skip_consecutive: z.number().int().min(1).optional(),
});

export const addBoxItemSchema = z.object({
  variant_id: z.number().int(),
  quantity: z.number().int().min(1),
  sort_order: z.number().int().default(0),
});

export const subscribeSchema = z.object({
  box_id: z.number().int(),
  customer_id: z.number().int(),
  payment_provider: z.enum(['kaspi_pay', 'halyk_bank']),
});

export const pauseSchema = z.object({
  reason: z.string().optional(),
});

export type CreateSubscriptionBoxDto = z.infer<typeof createSubscriptionBoxSchema>;
export type UpdateSubscriptionBoxDto = z.infer<typeof updateSubscriptionBoxSchema>;
export type AddBoxItemDto = z.infer<typeof addBoxItemSchema>;
export type SubscribeDto = z.infer<typeof subscribeSchema>;
export type PauseDto = z.infer<typeof pauseSchema>;
