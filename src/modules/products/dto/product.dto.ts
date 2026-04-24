import { z } from 'zod';

export const createProductSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  slug: z.string().max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'active']).default('draft'),
  weightGrams: z.number().int().default(0),
  allowBackorder: z.boolean().default(false),
  lowStockAlert: z.number().int().default(5),
  categoryIds: z.array(z.number().int()).optional(),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;

export const updateProductSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  weightGrams: z.number().int().optional(),
  allowBackorder: z.boolean().optional(),
  lowStockAlert: z.number().int().optional(),
  categoryIds: z.array(z.number().int()).optional(),
});

export type UpdateProductDto = z.infer<typeof updateProductSchema>;

export const productFilterSchema = z.object({
  status: z.enum(['draft', 'active', 'archived']).optional(),
  search: z.string().optional(),
  categoryId: z.number().int().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['asc', 'desc']).default('desc'),
});

export type ProductFilterDto = z.infer<typeof productFilterSchema>;

export const generateVariantsSchema = z.object({
  sizes: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  materials: z.array(z.string()).optional(),
  basePriceTiyin: z.number().int().positive('Base price must be positive'),
  compareAtPriceTiyin: z.number().int().optional(),
});

export type GenerateVariantsDto = z.infer<typeof generateVariantsSchema>;

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  slug: z.string().max(200).optional(),
  parentId: z.number().int().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().max(200).optional(),
  parentId: z.number().int().nullable().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;

export const categoryFilterSchema = z.object({
  tree: z.boolean().default(false),
  parentId: z.number().int().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type CategoryFilterDto = z.infer<typeof categoryFilterSchema>;
