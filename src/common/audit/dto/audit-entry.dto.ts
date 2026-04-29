import { z } from 'zod';

export const auditEntrySchema = z.object({
  actorId: z.number().optional().nullable(),
  actorType: z.enum(['merchant', 'staff', 'customer']),
  action: z.string().max(100),
  resourceType: z.string().max(100),
  resourceId: z.number().optional().nullable(),
  changes: z.any().optional().nullable(),
  ipAddress: z.string().max(45).optional().nullable(),
  userAgent: z.string().max(500).optional().nullable(),
  requestMethod: z.string().max(10).optional().nullable(),
  requestPath: z.string().max(500).optional().nullable(),
  responseStatus: z.number().optional().nullable(),
  durationMs: z.number().optional().nullable(),
  level: z.string().max(20).default('INFO'),
});

export type AuditEntryDto = z.infer<typeof auditEntrySchema>;
