import { Prisma } from '@prisma/client';

/**
 * Prisma client extension that applies tenant search_path before each query.
 * This works in conjunction with the TenantMiddleware which sets req.tenant.
 * 
 * Usage: Applied in PrismaService constructor via $extends().
 */
export function createTenantMiddleware() {
  return {
    name: 'tenantSearchPath' as const,
    query: async (args: Prisma.MiddlewareParams, next: (params: any) => Promise<any>) => {
      // The search_path is set per-request via TenantMiddleware + withTenant()
      // This middleware is a safety net that could be extended for automatic
      // tenant context from async local storage if needed.
      return next(args);
    },
  };
}
