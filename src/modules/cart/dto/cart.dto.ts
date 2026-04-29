import { z } from 'zod';

export const addCartItemSchema = z.object({
  variant_id: z.number().int().positive(),
  quantity: z.number().int().min(1),
});

export type AddCartItemDto = z.infer<typeof addCartItemSchema>;

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1),
});

export type UpdateCartItemDto = z.infer<typeof updateCartItemSchema>;
