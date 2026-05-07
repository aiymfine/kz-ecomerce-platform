import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { buildPaginationMeta, sliceForPagination } from '../../common/dto/pagination.dto';

type OrderStatus =
  | 'payment_pending'
  | 'payment_failed'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  payment_pending: ['payment_failed', 'confirmed', 'cancelled'],
  payment_failed: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
  refunded: [],
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private prisma: PrismaService) {}

  async listOrders(
    storeId: number,
    params: { status?: string; cursor?: string; limit: number; sort: 'asc' | 'desc' },
  ) {
    const where: any = {};
    if (params.status) where.status = params.status;

    const items = await this.prisma.withTenant(storeId, (client) =>
      client.order.findMany({
        where,
        take: params.limit + 1,
        cursor: params.cursor ? { id: parseInt(params.cursor) } : undefined,
        orderBy: { createdAt: params.sort === 'asc' ? 'asc' : 'desc' },
        include: {
          customer: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
    );

    return {
      data: sliceForPagination(items, params.limit),
      meta: buildPaginationMeta(params.limit, items, params.limit),
    };
  }

  async getOrderByNumber(storeId: number, orderNumber: string) {
    const order = await this.prisma.withTenant(storeId, (client) =>
      client.order.findUnique({
        where: { orderNumber },
        include: {
          items: true,
          payments: true,
          discounts: true,
        },
      }),
    );

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateOrderStatus(storeId: number, orderId: number, newStatus: OrderStatus) {
    const order = await this.prisma.withTenant(storeId, (client) =>
      client.order.findUnique({ where: { id: orderId } }),
    );

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const allowed = VALID_TRANSITIONS[order.status as OrderStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from '${order.status}' to '${newStatus}'. Allowed: ${allowed.join(', ') || 'none (terminal)'}`,
      );
    }

    return this.prisma.withTenant(storeId, (client) =>
      client.order.update({
        where: { id: orderId },
        data: { status: newStatus as any },
        include: { items: true, payments: true },
      }),
    );
  }

  async createFulfillment(
    storeId: number,
    orderId: number,
    data: { warehouseId: number; items: { order_item_id: number; quantity: number }[] },
  ) {
    const order = await this.prisma.withTenant(storeId, (client) =>
      client.order.findUnique({ where: { id: orderId } }),
    );

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== 'confirmed' && order.status !== 'processing') {
      throw new BadRequestException('Order must be confirmed or processing to create fulfillment');
    }

    return this.prisma.withTenant(storeId, (client) =>
      client.orderFulfillment.create({
        data: {
          orderId,
          warehouseId: data.warehouseId,
          status: 'pending',
        },
      }),
    );
  }

  async updateFulfillment(
    storeId: number,
    orderId: number,
    fulfillmentId: number,
    data: { tracking_number?: string; status?: string },
  ) {
    const fulfillment = await this.prisma.withTenant(storeId, (client) =>
      client.orderFulfillment.findFirst({
        where: { id: fulfillmentId, orderId },
      }),
    );

    if (!fulfillment) {
      throw new NotFoundException('Fulfillment not found');
    }

    const updateData: any = {};
    if (data.tracking_number !== undefined) updateData.trackingNumber = data.tracking_number;
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === 'shipped') updateData.shippedAt = new Date();
    }

    return this.prisma.withTenant(storeId, (client) =>
      client.orderFulfillment.update({
        where: { id: fulfillmentId },
        data: updateData,
      }),
    );
  }

  generateOrderNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `SB-${timestamp}-${random}`;
  }
}
