import { z } from 'zod';

export const initiatePaymentSchema = z.object({
  order_id: z.number().int().positive(),
  provider: z.enum(['kaspi_pay', 'halyk_bank', 'manual']),
  idempotency_key: z.string().min(1).max(100),
});

export type InitiatePaymentDto = z.infer<typeof initiatePaymentSchema>;

export const refundSchema = z.object({
  amount_tiyin: z.number().int().positive(),
  reason: z.string().max(500).optional(),
});

export type RefundDto = z.infer<typeof refundSchema>;
