import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { buildPaginationMeta, sliceForPagination } from '../../common/dto/pagination.dto';
import { WebhooksService } from '../webhooks/webhooks.service';
import { QueueService } from '../../common/queue/queue.service';

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

  constructor(
    private prisma: PrismaService,
    private webhooksService: WebhooksService,
    private queueService: QueueService,
  ) {}

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

  async checkout(
    storeId: number,
    customerId: number,
    data: { shippingMethod: string; shippingAddress?: string; notes?: string },
  ) {
    // 1. Get active cart with items
    const cart = await this.prisma.withTenant(storeId, (client) =>
      client.cart.findFirst({
        where: { customerId, status: 'active' },
        include: { items: true },
      }),
    );

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('No active cart or cart is empty');
    }

    // 2. Get variant prices + product info
    const variantIds = cart.items.map((i) => i.variantId);
    const variants = await this.prisma.withTenant(storeId, (client) =>
      client.productVariant.findMany({
        where: { id: { in: variantIds } },
        select: { id: true, priceTiyin: true, sku: true, product: { select: { title: true } } },
      }),
    );
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    // 3. Calculate total + build order items
    let totalTiyin = 0;
    const orderItems = cart.items.map((item) => {
      const variant = variantMap.get(item.variantId);
      const price = variant?.priceTiyin || 0;
      const lineTotal = price * item.quantity;
      totalTiyin += lineTotal;
      return {
        variantId: item.variantId,
        productTitle: variant?.product?.title || 'Unknown Product',
        variantSku: variant?.sku || `variant-${item.variantId}`,
        quantity: item.quantity,
        unitPriceTiyin: price,
        totalPriceTiyin: lineTotal,
      };
    });

    const orderNumber = this.generateOrderNumber();

    // 4. Create order with items
    const order = await this.prisma.withTenant(storeId, (client) =>
      client.order.create({
        data: {
          customerId,
          orderNumber,
          status: 'payment_pending',
          subtotalTiyin: totalTiyin,
          totalTiyin,
          shippingMethod: data.shippingMethod as any,
          shippingAddress: data.shippingAddress || '',
          notes: data.notes || '',
          items: {
            create: orderItems,
          },
        },
        include: { items: true },
      }),
    );

    // 5. Mark cart as converted
    await this.prisma.withTenant(storeId, (client) =>
      client.cart.update({
        where: { id: cart.id },
        data: { status: 'converted' },
      }),
    );

    // 6. Fire webhook event (non-blocking)
    try {
      await this.webhooksService.fireEvent(storeId, 'order.created', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        totalTiyin: order.totalTiyin,
        customerId,
        itemCount: order.items.length,
      });
    } catch (err) {
      this.logger.warn(`Failed to fire order.created webhook: ${err}`);
    }

    // 7. Enqueue order confirmation email (non-blocking)
    try {
      await this.queueService.enqueueEmail({
        type: 'order-confirmation',
        to: '',
        data: {
          orderNumber: order.orderNumber,
          items: order.items.map((i: any) => ({
            title: i.productTitle,
            sku: i.variantSku,
            quantity: i.quantity,
            price: i.unitPriceTiyin,
          })),
          totalTiyin: order.totalTiyin,
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to enqueue order confirmation email: ${err}`);
    }

    this.logger.log(`Order ${orderNumber} created for customer ${customerId}, total: ${totalTiyin} tiyin`);
    return order;
  }
}
