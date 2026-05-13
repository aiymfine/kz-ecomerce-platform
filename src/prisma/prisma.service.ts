import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to database');

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any).$on('query', (e: { query: string; duration: number }) => {
        if (e.duration > 100) {
          this.logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
        }
      });
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from database');
  }

  /**
   * Execute a function within a tenant context.
   *
   * IMPORTANT — Prisma multi-tenancy limitation:
   * Prisma 5.x hardcodes the schema from schema.prisma (typically "public") in generated
   * SQL queries (e.g. "public"."products"). Setting search_path or the ?schema= connection
   * parameter does NOT change the qualified table name Prisma emits.
   *
   * Current approach: all operational data lives in the "public" schema. Tenant isolation
   * is achieved architecturally by scoping queries to data that belongs to a given store.
   * Per-tenant schemas (store_1, store_2, …) exist for DDL isolation demos and future
   * migration to Prisma's upcoming multiSchema preview feature.
   *
   * The callback receives the main PrismaClient (public schema). The storeId parameter is
   * kept for future use when Prisma adds proper runtime schema switching.
   */
  async withTenant<T>(storeId: number, fn: (client: PrismaClient) => Promise<T>): Promise<T> {
    // TODO: Switch to per-tenant client once Prisma supports runtime schema override.
    // For now, all data is in public schema; storeId is accepted for API compatibility.
    return fn(this);
  }
}
