import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
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
   * Execute raw SQL within a specific tenant schema.
   * Sets search_path before executing the query.
   */
  async withTenant<T>(storeId: number, fn: () => Promise<T>): Promise<T> {
    await this.$executeRawUnsafe(
      `SET search_path TO store_${storeId}, public`,
    );
    try {
      return await fn();
    } finally {
      await this.$executeRawUnsafe(`SET search_path TO public`);
    }
  }

  /**
   * Execute raw SQL within a specific tenant schema (unsafe, for DDL).
   */
  async executeRawInTenant(storeId: number, sql: string) {
    await this.$executeRawUnsafe(
      `SET search_path TO store_${storeId}, public`,
    );
    await this.$executeRawUnsafe(sql);
    await this.$executeRawUnsafe(`SET search_path TO public`);
  }
}
