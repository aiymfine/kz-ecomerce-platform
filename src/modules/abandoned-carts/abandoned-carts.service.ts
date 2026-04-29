import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { randomUUID } from 'crypto';

@Injectable()
export class AbandonedCartsService {
  private readonly logger = new Logger(AbandonedCartsService.name);

  constructor(private prisma: PrismaService) {}

  async listAbandonedCarts(params: {
    status?: string;
    from_date?: string;
    to_date?: string;
    cursor?: string;
    limit: number;
  }) {
    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.from_date || params.to_date) {
      where.createdAt = {};
      if (params.from_date) where.createdAt.gte = new Date(params.from_date);
      if (params.to_date) where.createdAt.lte = new Date(params.to_date);
    }

    const items = await this.prisma.abandonedCart.findMany({
      where,
      take: params.limit + 1,
      cursor: params.cursor ? { id: parseInt(params.cursor) } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });

    return {
      data: items.slice(0, params.limit),
      meta: {
        limit: params.limit,
        hasMore: items.length > params.limit,
        cursor:
          items.length > params.limit
            ? String(items[items.length - 1].id)
            : undefined,
      },
    };
  }

  async getAbandonedCart(id: number) {
    const cart = await this.prisma.abandonedCart.findUnique({
      where: { id },
      include: { customer: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });
    if (!cart) throw new NotFoundException('Abandoned cart not found');
    return cart;
  }

  getConfig() {
    return {
      first_email_hours: 2,
      second_email_hours: 24,
      second_discount_percent: 10,
      third_email_hours: 72,
      third_discount_percent: 15,
      discount_expiry_hours: 48,
      max_emails: 3,
    };
  }

  async scan() {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const activeCarts = await this.prisma.cart.findMany({
      where: {
        status: 'active',
        updatedAt: { lte: twoHoursAgo },
        items: { some: {} },
      },
      include: { items: true, customer: true },
    });

    let detected = 0;

    for (const cart of activeCarts) {
      const exists = await this.prisma.abandonedCart.findFirst({
        where: { customerId: cart.customerId },
      });
      if (exists) continue;

      await this.prisma.abandonedCart.create({
        data: {
          customerId: cart.customerId,
          cartSnapshot: cart as any,
          recoveryCode: randomUUID(),
          status: 'pending',
          expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
        },
      });

      await this.prisma.cart.update({
        where: { id: cart.id },
        data: { status: 'abandoned' },
      });

      detected++;
    }

    this.logger.log(`Abandoned cart scan: ${detected} new carts detected`);
    return { detected };
  }
}
