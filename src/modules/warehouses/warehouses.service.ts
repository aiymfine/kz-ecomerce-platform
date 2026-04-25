import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WarehousesService {
  private readonly logger = new Logger(WarehousesService.name);

  constructor(private prisma: PrismaService) {}

  async listWarehouses(storeId: number) {
    return this.prisma.withTenant(storeId, () =>
      this.prisma.warehouse.findMany({
        where: {},
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  async getWarehouse(storeId: number, warehouseId: number) {
    const warehouse = await this.prisma.withTenant(storeId, () =>
      this.prisma.warehouse.findUnique({
        where: { id: warehouseId },
      }),
    );

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    return warehouse;
  }

  async createWarehouse(
    storeId: number,
    data: {
      name: string;
      address: string;
      city: string;
      latitude?: number;
      longitude?: number;
    },
  ) {
    return this.prisma.withTenant(storeId, () =>
      this.prisma.warehouse.create({
        data: {
          name: data.name,
          address: data.address,
          city: data.city,
          latitude: data.latitude,
          longitude: data.longitude,
        },
      }),
    );
  }

  async updateWarehouse(
    storeId: number,
    warehouseId: number,
    data: {
      name?: string;
      address?: string;
      city?: string;
      latitude?: number;
      longitude?: number;
      isActive?: boolean;
    },
  ) {
    await this.getWarehouse(storeId, warehouseId); // ensure exists

    const updateData: any = {};
    Object.keys(data).forEach((key) => {
      if (data[key as keyof typeof data] !== undefined) {
        updateData[key] = data[key as keyof typeof data];
      }
    });

    return this.prisma.withTenant(storeId, () =>
      this.prisma.warehouse.update({
        where: { id: warehouseId },
        data: updateData,
      }),
    );
  }

  async deleteWarehouse(storeId: number, warehouseId: number) {
    await this.getWarehouse(storeId, warehouseId); // ensure exists

    // Check for inventory records
    const inventoryCount = await this.prisma.withTenant(storeId, () =>
      this.prisma.inventory.count({
        where: { warehouseId },
      }),
    );

    if (inventoryCount > 0) {
      return {
        statusCode: 409,
        message: `Cannot delete warehouse with ${inventoryCount} inventory records`,
      };
    }

    return this.prisma.withTenant(storeId, () =>
      this.prisma.warehouse.delete({
        where: { id: warehouseId },
      }),
    );
  }
}
