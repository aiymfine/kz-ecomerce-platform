import { z } from 'zod';

export const inviteStaffSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(1, 'Name is required').max(200),
  role: z.enum(['inventory_manager', 'order_processor', 'analytics_viewer']),
  permissions: z.record(z.unknown()).default({}),
});

export type InviteStaffDto = z.infer<typeof inviteStaffSchema>;

export const updateStaffSchema = z.object({
  role: z
    .enum(['inventory_manager', 'order_processor', 'analytics_viewer'])
    .optional(),
  permissions: z.record(z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateStaffDto = z.infer<typeof updateStaffSchema>;
