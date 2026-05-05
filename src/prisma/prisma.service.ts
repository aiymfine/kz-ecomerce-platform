import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private tenantClients: Map<number, PrismaClient> = new Map();

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
    for (const [, client] of this.tenantClients) {
      await client.$disconnect();
    }
    this.tenantClients.clear();
    await this.$disconnect();
    this.logger.log('Disconnected from database');
  }

  /**
   * Get or create a cached PrismaClient for a specific tenant schema.
   * Uses Prisma's official multi-tenancy approach: connection URL with schema parameter.
   * No raw SQL needed.
   */
  getTenantClient(storeId: number): PrismaClient {
    if (!this.tenantClients.has(storeId)) {
      const baseUrl = process.env.DATABASE_URL!;
      const url = new URL(baseUrl);
      url.searchParams.set('schema', `store_${storeId}`);
      const client = new PrismaClient({
        datasourceUrl: url.toString(),
      });
      this.tenantClients.set(storeId, client);
    }
    return this.tenantClients.get(storeId)!;
  }

  /**
   * Execute a function within a tenant context.
   * The callback receives a PrismaClient connected to the tenant's schema.
   * All Prisma operations inside the callback use the tenant's schema automatically.
   */
  async withTenant<T>(storeId: number, fn: (client: PrismaClient) => Promise<T>): Promise<T> {
    const client = this.getTenantClient(storeId);
    return fn(client);
  }
}
