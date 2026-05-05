import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StoresService {
  private readonly logger = new Logger(StoresService.name);
  private readonly tenantTables = [
    'products',
    'product_images',
    'categories',
    'product_categories',
    'variant_attributes',
    'variant_attribute_values',
    'product_variants',
    'warehouses',
    'inventory',
    'customers',
    'addresses',
    'cart_items',
    'carts',
    'orders',
    'order_items',
    'payments',
    'order_fulfillments',
    'promo_codes',
    'order_discounts',
    'webhooks',
    'webhook_events',
    'subscription_boxes',
    'subscription_box_items',
    'subscription_orders',
    'staff_members',
    'theme_templates',
    'abandoned_carts',
    'store_audit_log',
  ];

  private readonly tablesWithUpdatedAt = [
    'products',
    'product_variants',
    'customers',
    'carts',
    'cart_items',
    'orders',
    'staff_members',
    'theme_templates',
    'inventory',
  ];

  constructor(private prisma: PrismaService) {}

  async listStores(merchantId: number) {
    return this.prisma.store.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        subdomain: true,
        customDomain: true,
        status: true,
        plan: true,
        isLive: true,
        currency: true,
        createdAt: true,
      },
    });
  }

  async createStore(
    merchantId: number,
    data: {
      name: string;
      subdomain: string;
      customDomain?: string;
      timezone?: string;
      currency?: string;
      vatRate?: number;
    },
  ) {
    const existing = await this.prisma.store.findUnique({
      where: { subdomain: data.subdomain },
    });
    if (existing) {
      return { error: 'CONFLICT', message: 'Subdomain already taken' };
    }

    const store = await this.prisma.store.create({
      data: {
        merchantId,
        name: data.name,
        subdomain: data.subdomain,
        customDomain: data.customDomain,
        schemaName: `store_${Date.now()}`,
        timezone: data.timezone || 'Asia/Almaty',
        currency: data.currency || 'KZT',
        vatRate: data.vatRate ?? 12,
      },
    });

    await this.prisma.store.update({
      where: { id: store.id },
      data: { schemaName: `store_${store.id}` },
    });

    try {
      await this.provisionTenant(store.id);
    } catch (err) {
      this.logger.error(`Failed to provision tenant for store ${store.id}`);
      await this.prisma.tenantProvisioningLog.create({
        data: {
          storeId: store.id,
          action: 'provision_schema',
          status: 'failed',
          details: { error: (err as Error).message },
        },
      });
    }

    return store;
  }

  async getStore(storeId: number, merchantId: number) {
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, merchantId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return store;
  }

  async updateStore(storeId: number, merchantId: number, data: Record<string, unknown>) {
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, merchantId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const updateData: any = { ...data };
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key],
    );

    return this.prisma.store.update({
      where: { id: storeId },
      data: updateData,
    });
  }

  private async provisionTenant(storeId: number) {
    const schema = `store_${storeId}`;
    this.logger.log(`Provisioning tenant schema ${schema}`);

    await this.prisma.$executeRaw(Prisma.sql`BEGIN`);

    try {
      await this.prisma.$executeRaw(
        Prisma.sql`CREATE SCHEMA IF NOT EXISTS ${Prisma.raw(schema)}`,
      );

      for (const table of this.tenantTables) {
        await this.prisma.$executeRaw(
          Prisma.sql`CREATE TABLE IF NOT EXISTS ${Prisma.raw(`${schema}.${table}`)} (LIKE public.${Prisma.raw(table)} INCLUDING ALL)`,
        );
      }

      // Fix updated_at: add DEFAULT NOW() so ORM operations work
      for (const table of this.tablesWithUpdatedAt) {
        await this.prisma.$executeRaw(
          Prisma.sql`ALTER TABLE ${Prisma.raw(`${schema}.${table}`)} ALTER COLUMN updated_at SET DEFAULT NOW()`,
        );
      }

      // Default categories
      const categories = [
        { name: 'Все товары', slug: 'all', path: '/', depth: 0, sortOrder: 0 },
        { name: 'Новинки', slug: 'new', path: '/', depth: 0, sortOrder: 1 },
        { name: 'Распродажа', slug: 'sale', path: '/', depth: 0, sortOrder: 2 },
      ];
      for (const cat of categories) {
        await this.prisma.$executeRaw(
          Prisma.sql`INSERT INTO ${Prisma.raw(`${schema}.categories`)} (name, slug, path, depth, sort_order) VALUES (${cat.name}, ${cat.slug}, ${cat.path}, ${cat.depth}, ${cat.sortOrder})`,
        );
      }

      await this.prisma.$executeRaw(Prisma.sql`COMMIT`);

      await this.prisma.tenantProvisioningLog.create({
        data: {
          storeId,
          action: 'provision_schema',
          status: 'completed',
          details: { tables: this.tenantTables },
        },
      });

      this.logger.log(`Tenant ${schema} provisioned successfully`);
    } catch (err) {
      await this.prisma.$executeRaw(Prisma.sql`ROLLBACK`);
      throw err;
    }
  }
}
