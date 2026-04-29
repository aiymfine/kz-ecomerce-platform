import { z } from 'zod';

export const approveMerchantSchema = z.object({});

export type ApproveMerchantDto = z.infer<typeof approveMerchantSchema>;

export const rejectMerchantSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required').max(500),
});

export type RejectMerchantDto = z.infer<typeof rejectMerchantSchema>;

export const adminMerchantFilterSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'suspended']).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type AdminMerchantFilterDto = z.infer<typeof adminMerchantFilterSchema>;

export const adminAuditFilterSchema = z.object({
  action: z.string().optional(),
  resourceType: z.string().optional(),
  level: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type AdminAuditFilterDto = z.infer<typeof adminAuditFilterSchema>;
