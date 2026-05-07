import { z } from 'zod';

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'payment_pending',
    'payment_failed',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
  ]),
});

export type UpdateOrderStatusDto = z.infer<typeof updateOrderStatusSchema>;

export const createFulfillmentSchema = z.object({
  warehouse_id: z.number().int().positive(),
  items: z.array(
    z.object({
      order_item_id: z.number().int().positive(),
      quantity: z.number().int().positive(),
    }),
  ),
});

export type CreateFulfillmentDto = z.infer<typeof createFulfillmentSchema>;

export const updateFulfillmentSchema = z.object({
  tracking_number: z.string().max(100).optional(),
  status: z.enum(['pending', 'shipped', 'delivered']).optional(),
});

export type UpdateFulfillmentDto = z.infer<typeof updateFulfillmentSchema>;

export const orderFilterSchema = z.object({
  status: z
    .enum([
      'payment_pending',
      'payment_failed',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'refunded',
    ])
    .optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['asc', 'desc']).default('desc'),
});

export type OrderFilterDto = z.infer<typeof orderFilterSchema>;
