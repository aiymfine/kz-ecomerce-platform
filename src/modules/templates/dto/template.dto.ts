import { z } from 'zod';

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  templateContent: z.string().min(1),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  templateContent: z.string().min(1).optional(),
});

export const renderTemplateSchema = z.object({
  data: z.record(z.any()).default({}),
});

export type CreateTemplateDto = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateDto = z.infer<typeof updateTemplateSchema>;
export type RenderTemplateDto = z.infer<typeof renderTemplateSchema>;
