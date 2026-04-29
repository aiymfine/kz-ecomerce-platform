import { z } from 'zod';

export const createPromoCodeSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9-]+$/, 'Code must be alphanumeric with hyphens only'),
  type: z.enum(['percentage', 'fixed_amount', 'free_shipping']),
  value: z.number().int().positive(),
  min_order_tiyin: z.number().int().min(0).default(0),
  max_uses: z.number().int().positive().optional(),
  max_per_customer: z.number().int().positive().default(1),
  is_stackable: z.boolean().default(false),
  first_buyer_only: z.boolean().default(false),
  starts_at: z.string().datetime().optional(),
  expires_at: z.string().datetime().optional(),
});

export type CreatePromoCodeDto = z.infer<typeof createPromoCodeSchema>;

export const updatePromoCodeSchema = createPromoCodeSchema.partial().omit({ code: true });

export type UpdatePromoCodeDto = z.infer<typeof updatePromoCodeSchema>;

export const validatePromoCodeSchema = z.object({
  code: z.string().min(1),
  cart_subtotal_tiyin: z.number().int().min(0),
  customer_id: z.number().int().positive().optional(),
});

export type ValidatePromoCodeDto = z.infer<typeof validatePromoCodeSchema>;
