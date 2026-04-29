import { z } from 'zod';

export const analyticsDateRangeSchema = z.object({
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
  granularity: z.enum(['day', 'week', 'month']).default('day'),
});

export type AnalyticsDateRangeDto = z.infer<typeof analyticsDateRangeSchema>;
