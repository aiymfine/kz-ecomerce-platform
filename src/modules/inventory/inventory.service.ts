import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { buildPaginationMeta, sliceForPagination } from '../../common/dto/pagination.dto';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private prisma: PrismaService) {}

  async listInventory(storeId: number, params: { cursor?: string; limit: number }) {
    const items = await this.prisma.withTenant(storeId, () =>
      this.prisma.inventory.findMany({
        take: params.limit + 1,
        cursor: params.cursor ? { id: parseInt(params.cursor) } : undefined,
        orderBy: { updatedAt: 'desc' },
      }),
    );

    const sliced = sliceForPagination(items, params.limit);

    // Enrich with variant and warehouse data
    const enriched = await this.enrichInventory(storeId, sliced);

    return {
      data: enriched,
      meta: buildPaginationMeta(params.limit, items, params.limit),
    };
  }

  async listByWarehouse(storeId: number, warehouseId: number) {
    const items = await this.prisma.withTenant(storeId, () =>
      this.prisma.inventory.findMany({
        where: { warehouseId },
      }),
    );

    return this.enrichInventory(storeId, items);
  }

  async listByVariant(storeId: number, variantId: number) {
    const items = await this.prisma.withTenant(storeId, () =>
      this.prisma.inventory.findMany({
        where: { variantId },
      }),
    );

    return this.enrichInventory(storeId, items);
  }

  async setInventory(
    storeId: number,
    data: {
      variantId: number;
      warehouseId: number;
      quantityAvailable: number;
      lowStockThreshold: number;
    },
  ) {
    const result = await this.prisma.withTenant(storeId, () =>
      this.prisma.inventory.upsert({
        where: {
          variantId_warehouseId: {
            variantId: data.variantId,
            warehouseId: data.warehouseId,
          },
        },
        create: {
          variantId: data.variantId,
          warehouseId: data.warehouseId,
          quantityAvailable: data.quantityAvailable,
          lowStockThreshold: data.lowStockThreshold,
        },
        update: {
          quantityAvailable: data.quantityAvailable,
          lowStockThreshold: data.lowStockThreshold,
        },
      }),
    );

    const enriched = await this.enrichInventory(storeId, [result]);
    return enriched[0];
  }

  async adjustInventory(storeId: number, id: number, quantityChange: number) {
    return this.prisma.withTenant(storeId, async () => {
      const result = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT quantity_available FROM inventory WHERE id = $1 FOR UPDATE`,
        id,
      );

      if (!result.length) {
        throw new NotFoundException('Inventory record not found');
      }

      const newQuantity = result[0].quantity_available + quantityChange;
      if (newQuantity < 0) {
        throw new BadRequestException(
          'Insufficient stock: quantity would go below zero',
        );
      }

      const updated = await this.prisma.$queryRawUnsafe<any[]>(
        `UPDATE inventory SET quantity_available = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        newQuantity,
        id,
      );

      return updated[0];
    });
  }

  async transferInventory(
    storeId: number,
    data: {
      variantId: number;
      fromWarehouseId: number;
      toWarehouseId: number;
      quantity: number;
    },
  ) {
    return this.prisma.withTenant(storeId, async () => {
      return this.prisma.$transaction(async () => {
        const fromResult = await this.prisma.$queryRawUnsafe<any[]>(
          `SELECT quantity_available FROM inventory WHERE variant_id = $1 AND warehouse_id = $2 FOR UPDATE`,
          data.variantId,
          data.fromWarehouseId,
        );

        if (!fromResult.length) {
          throw new NotFoundException('Source inventory not found');
        }

        if (fromResult[0].quantity_available < data.quantity) {
          throw new BadRequestException('Insufficient stock at source warehouse');
        }

        await this.prisma.$queryRawUnsafe(
          `UPDATE inventory SET quantity_available = quantity_available - $1, updated_at = NOW() WHERE variant_id = $2 AND warehouse_id = $3`,
          data.quantity,
          data.variantId,
          data.fromWarehouseId,
        );

        await this.prisma.$queryRawUnsafe(
          `INSERT INTO inventory (variant_id, warehouse_id, quantity_available, quantity_reserved, low_stock_threshold, created_at, updated_at)
           VALUES ($1, $2, $3, 0, 5, NOW(), NOW())
           ON CONFLICT (variant_id, warehouse_id)
           DO UPDATE SET quantity_available = inventory.quantity_available + $3, updated_at = NOW()`,
          data.variantId,
          data.toWarehouseId,
          data.quantity,
        );

        return { message: 'Transfer completed' };
      });
    });
  }

  async findNearestWarehouse(
    storeId: number,
    variantIds: number[],
    customerLatitude: number,
    customerLongitude: number,
  ) {
    return this.prisma.withTenant(storeId, async () => {
      const variantPlaceholders = variantIds.map((_, i) => `$${i + 3}`).join(',');
      const query = `
        SELECT
          w.id as "warehouse_id",
          w.name as "warehouse_name",
          w.city,
          w.latitude,
          w.longitude,
          i.variant_id,
          i.quantity_available,
          6371 * acos(
            LEAST(1.0, cos(radians($1)) * cos(radians(w.latitude)) *
            cos(radians(w.longitude) - radians($2)) +
            sin(radians($1)) * sin(radians(w.latitude)))
          ) AS "distance_km"
        FROM warehouses w
        JOIN inventory i ON i.warehouse_id = w.id
        WHERE w.is_active = true
          AND i.variant_id IN (${variantPlaceholders})
          AND i.quantity_available > 0
        ORDER BY "distance_km" ASC
      `;

      const results = await this.prisma.$queryRawUnsafe<any[]>(
        query,
        customerLatitude,
        customerLongitude,
        ...variantIds,
      );

      return results;
    });
  }

  private async enrichInventory(storeId: number, items: any[]) {
    if (!items.length) return items;

    const variantIds = [...new Set(items.map((i) => i.variantId))];
    const warehouseIds = [...new Set(items.map((i) => i.warehouseId))];

    const [variants, warehouses] = await Promise.all([
      this.prisma.withTenant(storeId, () =>
        this.prisma.productVariant.findMany({
          where: { id: { in: variantIds } },
          include: { product: { select: { title: true } } },
        }),
      ),
      this.prisma.withTenant(storeId, () =>
        this.prisma.warehouse.findMany({
          where: { id: { in: warehouseIds } },
        }),
      ),
    ]);

    const variantMap = new Map(variants.map((v) => [v.id, v]));
    const warehouseMap = new Map(warehouses.map((w) => [w.id, w]));

    return items.map((item) => ({
      ...item,
      variant: variantMap.get(item.variantId) || null,
      warehouse: warehouseMap.get(item.warehouseId) || null,
    }));
  }
}
