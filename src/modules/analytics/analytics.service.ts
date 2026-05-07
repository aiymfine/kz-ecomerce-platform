import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  private getDateRange(params: { from_date?: string; to_date?: string }) {
    const to = params.to_date ? new Date(params.to_date) : new Date();
    const from = params.from_date
      ? new Date(params.from_date)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return { from, to };
  }

  async getSales(params: { from_date?: string; to_date?: string; granularity?: string }) {
    const { from, to } = this.getDateRange(params);

    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: ['confirmed', 'processing', 'shipped', 'delivered'] },
        createdAt: { gte: from, lte: to },
      },
      select: { totalTiyin: true, createdAt: true },
    });

    const totalRevenue = orders.reduce((sum, o) => sum + o.totalTiyin, 0);
    const orderCount = orders.length;
    const avgOrderValue = orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0;

    const result: any = {
      total_revenue_tiyin: totalRevenue,
      order_count: orderCount,
      avg_order_value_tiyin: avgOrderValue,
      from,
      to,
    };

    if (params.granularity && params.granularity !== 'day') {
      // Group by granularity
      const grouped: Record<string, { revenue: number; count: number }> = {};
      for (const order of orders) {
        let key: string;
        const d = new Date(order.createdAt);
        if (params.granularity === 'week') {
          const weekStart = new Date(d);
          weekStart.setDate(d.getDate() - d.getDay());
          key = weekStart.toISOString().slice(0, 10);
        } else {
          key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        }
        if (!grouped[key]) grouped[key] = { revenue: 0, count: 0 };
        grouped[key].revenue += order.totalTiyin;
        grouped[key].count++;
      }
      result.by_period = grouped;
    }

    return result;
  }

  async getProducts() {
    const items = await this.prisma.orderItem.findMany({
      include: { order: { select: { status: true } } },
    });

    const productMap: Record<
      string,
      { revenue: number; sold: number; title: string; sku: string }
    > = {};

    for (const item of items) {
      if (!['confirmed', 'processing', 'shipped', 'delivered'].includes(item.order.status))
        continue;
      const key = `${item.variantSku}`;
      if (!productMap[key]) {
        productMap[key] = { revenue: 0, sold: 0, title: item.productTitle, sku: item.variantSku };
      }
      productMap[key].revenue += item.unitPriceTiyin * item.quantity;
      productMap[key].sold += item.quantity;
    }

    const sorted = Object.values(productMap).sort((a, b) => b.revenue - a.revenue);
    return {
      top_performers: sorted.slice(0, 20),
      low_performers: sorted.length > 20 ? sorted.slice(-10).reverse() : [],
    };
  }

  async getCustomers(params: { from_date?: string; to_date?: string }) {
    const { from, to } = this.getDateRange(params);

    const newCustomers = await this.prisma.customer.count({
      where: { createdAt: { gte: from, lte: to } },
    });

    // Returning: customers who placed orders before the date range
    const returningCustomerIds = await this.prisma.order.findMany({
      where: { createdAt: { lt: from } },
      select: { customerId: true },
      distinct: ['customerId'],
    });
    const returningIds = new Set(returningCustomerIds.map((o) => o.customerId));

    const activeInPeriod = await this.prisma.order.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { customerId: true, totalTiyin: true },
    });

    let returningCustomers = 0;
    const customerSpend: Record<number, number> = {};

    for (const order of activeInPeriod) {
      customerSpend[order.customerId] = (customerSpend[order.customerId] || 0) + order.totalTiyin;
      if (returningIds.has(order.customerId)) returningCustomers++;
    }

    const topCustomers = Object.entries(customerSpend)
      .map(([id, spend]) => ({ customer_id: Number(id), total_spend_tiyin: spend }))
      .sort((a, b) => b.total_spend_tiyin - a.total_spend_tiyin)
      .slice(0, 20);

    return {
      new_customers: newCustomers,
      returning_customers: returningCustomers,
      top_spenders: topCustomers,
    };
  }

  async getInventory() {
    const allInventory = await this.prisma.inventory.findMany();
    const lowStock = allInventory
      .filter((inv) => inv.quantityAvailable <= inv.lowStockThreshold)
      .slice(0, 50);

    // Fetch variant details for low stock items
    const variantIds = lowStock.map((inv) => inv.variantId);
    const variants =
      variantIds.length > 0
        ? await this.prisma.productVariant.findMany({
            where: { id: { in: variantIds } },
            include: { product: { select: { title: true } } },
          })
        : [];
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    const total = await this.prisma.inventory.count();
    const totalAvailable = await this.prisma.inventory.aggregate({
      _sum: { quantityAvailable: true },
    });

    return {
      total_variants_in_inventory: total,
      total_units_available: totalAvailable._sum.quantityAvailable || 0,
      low_stock_alerts: allInventory.length,
      low_stock_items: lowStock.map((inv) => {
        const v = variantMap.get(inv.variantId);
        return {
          variant_id: inv.variantId,
          sku: v?.sku,
          product_title: v?.product?.title,
          available: inv.quantityAvailable,
          reserved: inv.quantityReserved,
          threshold: inv.lowStockThreshold,
        };
      }),
    };
  }
}
