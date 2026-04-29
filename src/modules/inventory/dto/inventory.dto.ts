import { z } from 'zod';

export const setInventorySchema = z.object({
  variant_id: z.number().int().positive(),
  warehouse_id: z.number().int().positive(),
  quantity_available: z.number().int().min(0),
  low_stock_threshold: z.number().int().min(0).default(5),
});

export type SetInventoryDto = z.infer<typeof setInventorySchema>;

export const adjustInventorySchema = z.object({
  quantity_change: z.number().int(),
});

export type AdjustInventoryDto = z.infer<typeof adjustInventorySchema>;

export const transferInventorySchema = z.object({
  variant_id: z.number().int().positive(),
  from_warehouse_id: z.number().int().positive(),
  to_warehouse_id: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

export type TransferInventoryDto = z.infer<typeof transferInventorySchema>;

export const nearestWarehouseSchema = z.object({
  variant_ids: z.array(z.number().int().positive()).min(1),
  customer_latitude: z.number().min(-90).max(90),
  customer_longitude: z.number().min(-180).max(180),
});

export type NearestWarehouseDto = z.infer<typeof nearestWarehouseSchema>;
