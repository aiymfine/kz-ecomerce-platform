import { z } from 'zod';

export const updateCustomerSchema = z.object({
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
});

export type UpdateCustomerDto = z.infer<typeof updateCustomerSchema>;

export const createAddressSchema = z.object({
  label: z.string().max(50).optional(),
  full_name: z.string().min(1, 'Full name is required').max(200),
  phone: z.string().min(1, 'Phone is required').max(20),
  address_line1: z.string().min(1, 'Address line 1 is required').max(255),
  address_line2: z.string().max(255).optional(),
  city: z.string().min(1, 'City is required').max(100),
  region: z.string().max(100).optional(),
  postal_code: z.string().max(20).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  is_default: z.boolean().optional(),
});

export type CreateAddressDto = z.infer<typeof createAddressSchema>;

export const updateAddressSchema = z.object({
  label: z.string().max(50).optional(),
  full_name: z.string().max(200).optional(),
  phone: z.string().max(20).optional(),
  address_line1: z.string().max(255).optional(),
  address_line2: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
  postal_code: z.string().max(20).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  is_default: z.boolean().optional(),
});

export type UpdateAddressDto = z.infer<typeof updateAddressSchema>;
