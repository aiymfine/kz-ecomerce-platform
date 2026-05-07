import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { buildPaginationMeta, sliceForPagination } from '../../common/dto/pagination.dto';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private prisma: PrismaService) {}

  async listInventory(storeId: number, params: { cursor?: string; limit: number }) {
    const items = await this.prisma.withTenant(storeId, (client) =>
      client.inventory.findMany({
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
    const items = await this.prisma.withTenant(storeId, (client) =>
      client.inventory.findMany({
        where: { warehouseId },
      }),
    );

    return this.enrichInventory(storeId, items);
  }

  async listByVariant(storeId: number, variantId: number) {
    const items = await this.prisma.withTenant(storeId, (client) =>
      client.inventory.findMany({
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
    // Validate foreign keys before upsert to give clear errors
    const [variant, warehouse] = await Promise.all([
      this.prisma.withTenant(storeId, (client) =>
        client.productVariant.findUnique({ where: { id: data.variantId } }),
      ),
      this.prisma.withTenant(storeId, (client) =>
        client.warehouse.findUnique({ where: { id: data.warehouseId } }),
      ),
    ]);

    if (!variant) {
      throw new NotFoundException(`Variant with id ${data.variantId} not found. Create product variants first via POST /stores/${storeId}/products/:id/variants`);
    }
    if (!warehouse) {
      throw new NotFoundException(`Warehouse with id ${data.warehouseId} not found. Create a warehouse first via POST /stores/${storeId}/warehouses`);
    }

    const result = await this.prisma.withTenant(storeId, (client) =>
      client.inventory.upsert({
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
    return this.prisma.withTenant(storeId, (client) =>
      client.$transaction(
        async (tx) => {
          const record = await tx.inventory.findUnique({
            where: { id },
          });
          if (!record) {
            throw new NotFoundException('Inventory record not found');
          }

          const newQuantity = record.quantityAvailable + quantityChange;
          if (newQuantity < 0) {
            throw new BadRequestException('Insufficient stock: quantity would go below zero');
          }

          const updated = await tx.inventory.update({
            where: { id },
            data: { quantityAvailable: newQuantity },
          });
          return updated;
        },
        { isolationLevel: 'Serializable' },
      ),
    );
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
    return this.prisma.withTenant(storeId, (client) =>
      client.$transaction(
        async (tx) => {
          const fromRecord = await tx.inventory.findFirst({
            where: {
              variantId: data.variantId,
              warehouseId: data.fromWarehouseId,
            },
          });

          if (!fromRecord) {
            throw new NotFoundException('Source inventory not found');
          }

          if (fromRecord.quantityAvailable < data.quantity) {
            throw new BadRequestException('Insufficient stock at source warehouse');
          }

          await tx.inventory.update({
            where: { id: fromRecord.id },
            data: { quantityAvailable: { decrement: data.quantity } },
          });

          // Upsert destination
          await tx.inventory.upsert({
            where: {
              variantId_warehouseId: {
                variantId: data.variantId,
                warehouseId: data.toWarehouseId,
              },
            },
            create: {
              variantId: data.variantId,
              warehouseId: data.toWarehouseId,
              quantityAvailable: data.quantity,
            },
            update: {
              quantityAvailable: { increment: data.quantity },
            },
          });

          return { message: 'Transfer completed' };
        },
        { isolationLevel: 'Serializable' },
      ),
    );
  }

  async findNearestWarehouse(
    storeId: number,
    variantIds: number[],
    customerLatitude: number,
    customerLongitude: number,
  ) {
    return this.prisma.withTenant(storeId, async (client) => {
      // Get all active warehouses
      const warehouses = await client.warehouse.findMany({
        where: { isActive: true },
      });
      const warehouseIds = new Set(warehouses.map((w) => w.id));
      const warehouseMap = new Map(warehouses.map((w) => [w.id, w]));

      // Get all inventory for requested variants at active warehouses
      const inventories = await client.inventory.findMany({
        where: {
          variantId: { in: variantIds },
          warehouseId: { in: [...warehouseIds] },
          quantityAvailable: { gt: 0 },
        },
      });

      // Deduplicate and aggregate quantities per warehouse
      const qtyMap = new Map<number, number>();
      for (const inv of inventories) {
        qtyMap.set(inv.warehouseId, (qtyMap.get(inv.warehouseId) || 0) + inv.quantityAvailable);
      }

      // Calculate distances using the Haversine utility and sort
      const { haversineDistance } = await import('../../common/utils/haversine');
      const results = Array.from(warehouseMap.entries())
        .filter(([id]) => qtyMap.has(id))
        .filter(([, w]) => w.latitude !== null && w.longitude !== null)
        .map(([id, w]) => ({
          warehouse_id: w.id,
          warehouse_name: w.name,
          city: w.city,
          latitude: w.latitude,
          longitude: w.longitude,
          distance_km: haversineDistance(
            customerLatitude,
            customerLongitude,
            w.latitude!,
            w.longitude!,
          ),
          quantity_available: qtyMap.get(id) || 0,
        }))
        .sort((a, b) => a.distance_km - b.distance_km);

      return results;
    });
  }

  private async enrichInventory(storeId: number, items: any[]) {
    if (!items.length) return items;

    const variantIds = [...new Set(items.map((i) => i.variantId))];
    const warehouseIds = [...new Set(items.map((i) => i.warehouseId))];

    const [variants, warehouses] = await Promise.all([
      this.prisma.withTenant(storeId, (client) =>
        client.productVariant.findMany({
          where: { id: { in: variantIds } },
          include: { product: { select: { title: true } } },
        }),
      ),
      this.prisma.withTenant(storeId, (client) =>
        client.warehouse.findMany({
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
