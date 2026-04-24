import { z } from 'zod';

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationDto = z.infer<typeof paginationSchema>;

export interface PaginationMeta {
  cursor?: string;
  limit: number;
  hasMore: boolean;
  total?: number;
}

export function buildPaginationMeta(
  limit: number,
  items: { id: number }[],
  requestedLimit: number,
): PaginationMeta {
  return {
    limit: requestedLimit,
    hasMore: items.length > requestedLimit,
    cursor: items.length > requestedLimit
      ? String(items[items.length - 1].id)
      : undefined,
  };
}

/**
 * Helper to slice off the extra item used for hasMore detection
 */
export function sliceForPagination<T>(items: T[], limit: number): T[] {
  return items.length > limit ? items.slice(0, limit) : items;
}
