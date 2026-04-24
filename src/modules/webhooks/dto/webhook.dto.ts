import { z } from 'zod';

export const createWebhookSchema = z.object({
  url: z.string().url('Invalid URL format').max(500),
  events: z
    .array(z.string().min(1))
    .min(1, 'At least one event is required'),
  isActive: z.boolean().default(true),
});

export type CreateWebhookDto = z.infer<typeof createWebhookSchema>;

export const updateWebhookSchema = z.object({
  url: z.string().url().max(500).optional(),
  events: z.array(z.string().min(1)).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateWebhookDto = z.infer<typeof updateWebhookSchema>;

export const webhookEventFilterSchema = z.object({
  status: z
    .enum(['pending', 'delivering', 'delivered', 'failed', 'dead_letter'])
    .optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type WebhookEventFilterDto = z.infer<typeof webhookEventFilterSchema>;
