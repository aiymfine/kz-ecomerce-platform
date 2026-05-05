import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { rejectMerchantSchema } from './dto/admin.dto';
import * as crypto from 'crypto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
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

  constructor(private prisma: PrismaService) {}

  // ==================== Merchants ====================

  async listMerchants(params: { status?: string; cursor?: string; limit: number }) {
    const where: any = {};
    if (params.status) {
      where.status = params.status;
    }

    const items = await this.prisma.merchant.findMany({
      where,
      take: params.limit + 1,
      cursor: params.cursor ? { id: parseInt(params.cursor) } : undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        businessName: true,
        status: true,
        isActive: true,
        createdAt: true,
        _count: { select: { stores: true } },
      },
    });

    return {
      data: items.slice(0, params.limit),
      meta: {
        limit: params.limit,
        hasMore: items.length > params.limit,
        cursor: items.length > params.limit ? String(items[items.length - 1].id) : undefined,
      },
    };
  }

  async getMerchant(id: number) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id },
      include: {
        stores: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            status: true,
            plan: true,
            createdAt: true,
          },
        },
      },
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    const { passwordHash, ...safe } = merchant;
    return safe;
  }

  async approveMerchant(id: number) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id },
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    if (merchant.status === 'approved') {
      return { message: 'Merchant is already approved' };
    }

    // Update merchant status
    const updated = await this.prisma.merchant.update({
      where: { id },
      data: { status: 'approved' },
    });

    // Create a default store for the merchant
    const store = await this.prisma.store.create({
      data: {
        merchantId: merchant.id,
        name: `${merchant.businessName || merchant.name}'s Store`,
        subdomain: `store-${merchant.id}-${Date.now()}`,
        schemaName: `store_${merchant.id}`,
        status: 'active',
      },
    });

    // Provision tenant schema
    try {
      await this.provisionTenant(store.id);
    } catch (err) {
      this.logger.error(`Failed to provision tenant for store ${store.id}: ${err}`);
      // Still mark as approved, but log provisioning failure
      await this.prisma.tenantProvisioningLog.create({
        data: {
          storeId: store.id,
          action: 'provision_schema',
          status: 'failed',
          details: { error: (err as Error).message },
        },
      });
    }

    // Log provisioning
    await this.prisma.tenantProvisioningLog.create({
      data: {
        storeId: store.id,
        action: 'approve_merchant',
        status: 'completed',
        details: { merchantId: merchant.id },
      },
    });

    const { passwordHash, ...safeMerchant } = updated;
    return { merchant: safeMerchant, store };
  }

  async rejectMerchant(id: number, reason: string) {
    const parsed = rejectMerchantSchema.safeParse({ reason });
    if (!parsed.success) {
      return { error: 'BAD_REQUEST', message: 'Invalid reason' };
    }

    const merchant = await this.prisma.merchant.findUnique({
      where: { id },
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    const updated = await this.prisma.merchant.update({
      where: { id },
      data: { status: 'rejected' },
    });

    const { passwordHash, ...safe } = updated;
    return { merchant: safe, reason };
  }

  async suspendMerchant(id: number) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id },
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    const updated = await this.prisma.merchant.update({
      where: { id },
      data: { status: 'suspended', isActive: false },
    });

    // Suspend all stores
    await this.prisma.store.updateMany({
      where: { merchantId: id },
      data: { status: 'suspended' },
    });

    const { passwordHash, ...safe } = updated;
    return { merchant: safe };
  }

  async activateMerchant(id: number) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id },
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    if (merchant.status !== 'suspended') {
      return { message: 'Merchant is not suspended' };
    }

    const updated = await this.prisma.merchant.update({
      where: { id },
      data: { status: 'approved', isActive: true },
    });

    // Activate all stores
    await this.prisma.store.updateMany({
      where: { merchantId: id },
      data: { status: 'active' },
    });

    const { passwordHash, ...safe } = updated;
    return { merchant: safe };
  }

  // ==================== Stores ====================

  async listStores(params: { cursor?: string; limit: number }) {
    const items = await this.prisma.store.findMany({
      take: params.limit + 1,
      cursor: params.cursor ? { id: parseInt(params.cursor) } : undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        subdomain: true,
        status: true,
        plan: true,
        isLive: true,
        createdAt: true,
        merchant: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return {
      data: items.slice(0, params.limit),
      meta: {
        limit: params.limit,
        hasMore: items.length > params.limit,
        cursor: items.length > params.limit ? String(items[items.length - 1].id) : undefined,
      },
    };
  }

  async suspendStore(storeId: number) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return this.prisma.store.update({
      where: { id: storeId },
      data: { status: 'suspended' },
    });
  }

  async activateStore(storeId: number) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return this.prisma.store.update({
      where: { id: storeId },
      data: { status: 'active' },
    });
  }

  // ==================== Analytics ====================

  async getAnalytics() {
    const [
      totalMerchants,
      activeMerchants,
      totalStores,
      activeStores,
      pendingMerchants,
      suspendedMerchants,
      rejectedMerchants,
    ] = await Promise.all([
      this.prisma.merchant.count(),
      this.prisma.merchant.count({ where: { status: 'approved' } }),
      this.prisma.store.count(),
      this.prisma.store.count({ where: { status: 'active' } }),
      this.prisma.merchant.count({ where: { status: 'pending' } }),
      this.prisma.merchant.count({ where: { status: 'suspended' } }),
      this.prisma.merchant.count({ where: { status: 'rejected' } }),
    ]);

    // Billing records for revenue data (public schema only)
    const billingRecords = await this.prisma.billingRecord.aggregate({
      _sum: { amountTiyin: true },
      where: { status: 'paid' },
    });

    const totalRevenueTiyin = billingRecords._sum.amountTiyin || 0;

    // Recent merchant registrations (last 30 days) for growth metric
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentMerchants = await this.prisma.merchant.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    const recentStores = await this.prisma.store.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    return {
      data: {
        merchants: {
          total: totalMerchants,
          active: activeMerchants,
          pending: pendingMerchants,
          suspended: suspendedMerchants,
          rejected: rejectedMerchants,
        },
        stores: {
          total: totalStores,
          active: activeStores,
        },
        billing: {
          totalRevenueTiyin,
          totalRevenueKZT: totalRevenueTiyin / 100,
        },
        growth: {
          newMerchantsLast30Days: recentMerchants,
          newStoresLast30Days: recentStores,
        },
      },
    };
  }

  // ==================== Audit Log ====================

  async getAuditLog(params: {
    action?: string;
    resourceType?: string;
    level?: string;
    cursor?: string;
    limit: number;
  }) {
    const where: any = {};
    if (params.action) where.action = params.action;
    if (params.resourceType) where.resourceType = params.resourceType;
    if (params.level) where.level = params.level;

    const items = await this.prisma.platformAuditLog.findMany({
      where,
      take: params.limit + 1,
      cursor: params.cursor ? { id: parseInt(params.cursor) } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: items.slice(0, params.limit),
      meta: {
        limit: params.limit,
        hasMore: items.length > params.limit,
        cursor: items.length > params.limit ? String(items[items.length - 1].id) : undefined,
      },
    };
  }

  // ==================== Tenant Provisioning ====================

  async provisionTenant(storeId: number) {
    this.logger.log(`Provisioning tenant schema for store ${storeId}`);

    await this.prisma.$executeRaw(Prisma.sql`BEGIN`);

    try {
      // Create schema
      await this.prisma.$executeRaw(
        Prisma.sql`CREATE SCHEMA IF NOT EXISTS ${Prisma.raw(`store_${storeId}`)}`,
      );

      // Create all tenant tables using LIKE public.tablename
      for (const table of this.tenantTables) {
        await this.prisma.$executeRaw(
          Prisma.sql`CREATE TABLE IF NOT EXISTS ${Prisma.raw(`store_${storeId}.${table}`)} (LIKE public.${Prisma.raw(table)} INCLUDING ALL)`,
        );
      }

      // Insert default categories
      await this.prisma.$executeRaw(
        Prisma.sql`SET search_path = ${Prisma.raw(`store_${storeId}`)}, public; INSERT INTO categories (name, slug, path, depth, sort_order) VALUES ('Все товары', 'all', '/', 0, 0), ('Новинки', 'new', '/', 0, 1), ('Распродажа', 'sale', '/', 0, 2); SET search_path = public;`,
      );

      await this.prisma.$executeRaw(Prisma.sql`COMMIT`);

      await this.prisma.tenantProvisioningLog.create({
        data: {
          storeId,
          action: 'provision_schema',
          status: 'completed',
          details: { tables: this.tenantTables },
        },
      });

      this.logger.log(`Tenant schema store_${storeId} provisioned successfully`);
    } catch (err) {
      await this.prisma.$executeRaw(Prisma.sql`ROLLBACK`);
      this.logger.error(`Failed to provision tenant: ${err}`);
      throw err;
    }
  }
}
