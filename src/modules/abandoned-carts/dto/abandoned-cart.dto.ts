import { z } from 'zod';

export const abandonedCartConfigSchema = z.object({
  first_email_hours: z.number().min(1).default(2),
  second_email_hours: z.number().min(1).default(24),
  second_discount_percent: z.number().min(0).max(100).default(10),
  third_email_hours: z.number().min(1).default(72),
  third_discount_percent: z.number().min(0).max(100).default(15),
  discount_expiry_hours: z.number().min(1).default(48),
  max_emails: z.number().int().min(1).default(3),
});

export const abandonedCartFilterSchema = z.object({
  status: z.enum(['pending', 'recovering', 'converted', 'expired']).optional(),
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type AbandonedCartConfigDto = z.infer<typeof abandonedCartConfigSchema>;
export type AbandonedCartFilterDto = z.infer<typeof abandonedCartFilterSchema>;
