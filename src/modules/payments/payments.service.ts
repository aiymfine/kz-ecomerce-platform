import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private prisma: PrismaService) {}

  async initiatePayment(storeId: number, data: {
    orderId: number;
    provider: 'kaspi_pay' | 'halyk_bank' | 'manual';
    idempotencyKey: string;
  }) {
    // Validate order
    const order = await this.prisma.withTenant(storeId, (client) =>
      client.order.findUnique({
        where: { id: data.orderId },
      }),
    );

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== 'payment_pending') {
      throw new BadRequestException(
        `Order status must be payment_pending, current: ${order.status}`,
      );
    }

    // Idempotency check
    const existing = await this.prisma.withTenant(storeId, (client) =>
      client.payment.findUnique({
        where: { idempotencyKey: data.idempotencyKey },
      }),
    );

    if (existing) {
      return existing;
    }

    // Create payment
    const payment = await this.prisma.withTenant(storeId, (client) =>
      client.payment.create({
        data: {
          orderId: data.orderId,
          provider: data.provider,
          amountTiyin: order.totalTiyin,
          status: data.provider === 'manual' ? 'succeeded' : 'pending',
          idempotencyKey: data.idempotencyKey,
          metadata: data.provider === 'manual' ? { method: 'manual' } : undefined,
        },
      }),
    );

    // For manual payment, update order status immediately
    if (data.provider === 'manual') {
      await this.prisma.withTenant(storeId, (client) =>
        client.order.update({
          where: { id: data.orderId },
          data: { status: 'confirmed' },
        }),
      );
      return payment;
    }

    // Mock payment URL/token for gateway providers
    const mockToken = randomBytes(16).toString('hex');
    return {
      ...payment,
      paymentUrl: `https://mock-gateway.${data.provider}.kz/pay?token=${mockToken}`,
      paymentToken: mockToken,
    };
  }

  async handleKaspiCallback(storeId: number, body: Record<string, unknown>) {
    return this.processCallback(storeId, body, 'kaspi_pay');
  }

  async handleHalykCallback(storeId: number, body: Record<string, unknown>) {
    return this.processCallback(storeId, body, 'halyk_bank');
  }

  private async processCallback(
    storeId: number,
    body: Record<string, unknown>,
    provider: string,
  ) {
    // Mock signature verification - in production, verify HMAC signature
    const paymentId = body.payment_id as number | undefined;
    const status = body.status as string | undefined;

    if (!paymentId || !status) {
      throw new BadRequestException('Missing payment_id or status in callback');
    }

    const payment = await this.prisma.withTenant(storeId, (client) =>
      client.payment.findUnique({ where: { id: paymentId } }),
    );

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const newStatus = status === 'success' ? 'succeeded' : 'failed';

    const updated = await this.prisma.withTenant(storeId, (client) =>
      client.payment.update({
        where: { id: paymentId },
        data: {
          status: newStatus,
          providerTxId: (body.provider_tx_id as string) || null,
          metadata: { ...(payment.metadata as Record<string, any> || {}), callback: body } as any,
        },
      }),
    );

    // Update order status on success
    if (newStatus === 'succeeded') {
      await this.prisma.withTenant(storeId, (client) =>
        client.order.update({
          where: { id: payment.orderId },
          data: { status: 'confirmed' },
        }),
      );
    } else {
      await this.prisma.withTenant(storeId, (client) =>
        client.order.update({
          where: { id: payment.orderId },
          data: { status: 'payment_failed' },
        }),
      );
    }

    return { status: 'ok', payment: updated };
  }

  async refund(storeId: number, paymentId: number, data: {
    amountTiyin: number;
    reason?: string;
  }) {
    const payment = await this.prisma.withTenant(storeId, (client) =>
      client.payment.findUnique({
        where: { id: paymentId },
      }),
    );

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== 'succeeded') {
      throw new BadRequestException(
        `Cannot refund payment with status: ${payment.status}`,
      );
    }

    if (data.amountTiyin > payment.amountTiyin) {
      throw new BadRequestException(
        `Refund amount (${data.amountTiyin}) exceeds payment amount (${payment.amountTiyin})`,
      );
    }

    const isFullRefund = data.amountTiyin === payment.amountTiyin;

    // Create refund payment record (negative amount)
    const refundPayment = await this.prisma.withTenant(storeId, (client) =>
      client.payment.create({
        data: {
          orderId: payment.orderId,
          provider: payment.provider,
          amountTiyin: -data.amountTiyin,
          status: 'refunded',
          idempotencyKey: `refund-${paymentId}-${Date.now()}`,
          metadata: {
            reason: data.reason || null,
            originalPaymentId: paymentId,
            providerTxId: payment.providerTxId,
          },
        },
      }),
    );

    // Update original payment status if full refund
    if (isFullRefund) {
      await this.prisma.withTenant(storeId, (client) =>
        client.payment.update({
          where: { id: paymentId },
          data: { status: 'refunded' },
        }),
      );
    }

    // Check if all payments for the order are refunded
    const allPayments = await this.prisma.withTenant(storeId, (client) =>
      client.payment.findMany({
        where: { orderId: payment.orderId },
      }),
    );

    const totalPaid = allPayments
      .filter((p) => p.status === 'succeeded')
      .reduce((sum, p) => sum + p.amountTiyin, 0);

    const totalRefunded = allPayments
      .filter((p) => p.status === 'refunded' && p.amountTiyin < 0)
      .reduce((sum, p) => sum + Math.abs(p.amountTiyin), 0);

    if (totalPaid <= totalRefunded) {
      await this.prisma.withTenant(storeId, (client) =>
        client.order.update({
          where: { id: payment.orderId },
          data: { status: 'refunded' },
        }),
      );
    }

    return refundPayment;
  }

  async getPaymentsByOrder(storeId: number, orderId: number) {
    const order = await this.prisma.withTenant(storeId, (client) =>
      client.order.findUnique({ where: { id: orderId } }),
    );

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.prisma.withTenant(storeId, (client) =>
      client.payment.findMany({
        where: { orderId },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }
}
