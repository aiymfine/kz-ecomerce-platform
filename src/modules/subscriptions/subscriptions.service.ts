import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { randomUUID } from 'crypto';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  // ---- Subscription Boxes ----

  async listBoxes() {
    return this.prisma.subscriptionBox.findMany({
      where: { isActive: true },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBox(id: number) {
    const box = await this.prisma.subscriptionBox.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!box) throw new NotFoundException('Subscription box not found');
    return box;
  }

  async createBox(data: {
    title: string;
    description?: string;
    price_tiyin: number;
    billing_cycle: 'weekly' | 'bi_weekly' | 'monthly';
    max_skip_consecutive: number;
  }) {
    return this.prisma.subscriptionBox.create({
      data: {
        title: data.title,
        description: data.description,
        priceTiyin: data.price_tiyin,
        billingCycle: data.billing_cycle,
        maxSkipConsecutive: data.max_skip_consecutive,
      },
    });
  }

  async updateBox(
    id: number,
    data: {
      title?: string;
      description?: string;
      price_tiyin?: number;
      billing_cycle?: 'weekly' | 'bi_weekly' | 'monthly';
      max_skip_consecutive?: number;
    },
  ) {
    await this.getBox(id);

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price_tiyin !== undefined) updateData.priceTiyin = data.price_tiyin;
    if (data.billing_cycle !== undefined) updateData.billingCycle = data.billing_cycle;
    if (data.max_skip_consecutive !== undefined)
      updateData.maxSkipConsecutive = data.max_skip_consecutive;

    return this.prisma.subscriptionBox.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteBox(id: number) {
    const box = await this.getBox(id);
    if (!box.isActive) throw new BadRequestException('Box is already inactive');

    return this.prisma.subscriptionBox.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async addBoxItem(
    boxId: number,
    data: { variant_id: number; quantity: number; sort_order: number },
  ) {
    await this.getBox(boxId);

    const variant = await this.prisma.productVariant.findUnique({
      where: { id: data.variant_id },
    });
    if (!variant) throw new NotFoundException('Variant not found');

    return this.prisma.subscriptionBoxItem.create({
      data: {
        boxId,
        variantId: data.variant_id,
        quantity: data.quantity,
        sortOrder: data.sort_order,
      },
    });
  }

  async removeBoxItem(boxId: number, variantId: number) {
    await this.getBox(boxId);

    const item = await this.prisma.subscriptionBoxItem.findFirst({
      where: { boxId, variantId },
    });
    if (!item) throw new NotFoundException('Box item not found');

    await this.prisma.subscriptionBoxItem.delete({
      where: { id: item.id },
    });
    return { message: 'Item removed from box' };
  }

  // ---- Subscriptions ----

  async subscribe(data: {
    box_id: number;
    customer_id: number;
    payment_provider: 'kaspi_pay' | 'halyk_bank';
  }) {
    const box = await this.prisma.subscriptionBox.findUnique({
      where: { id: data.box_id },
      include: { items: true },
    });
    if (!box || !box.isActive)
      throw new NotFoundException('Subscription box not found or inactive');

    const customer = await this.prisma.customer.findUnique({
      where: { id: data.customer_id },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const existing = await this.prisma.subscriptionOrder.findFirst({
      where: {
        boxId: data.box_id,
        customerId: data.customer_id,
        status: { in: ['active', 'paused'] },
      },
    });
    if (existing)
      throw new BadRequestException('Customer already has an active subscription to this box');

    const now = new Date();
    let nextBilling: Date;
    switch (box.billingCycle) {
      case 'weekly':
        nextBilling = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'bi_weekly':
        nextBilling = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        nextBilling = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const order = await this.prisma.subscriptionOrder.create({
      data: {
        boxId: data.box_id,
        customerId: data.customer_id,
        status: 'active',
        cycleNumber: 0,
        amountTiyin: box.priceTiyin,
        nextBillingAt: nextBilling,
      },
    });

    // Pre-reserve inventory for box items
    for (const item of box.items) {
      await this.prisma.inventory.updateMany({
        where: { variantId: item.variantId },
        data: { quantityReserved: { increment: item.quantity } },
      });
    }

    return order;
  }

  async mySubscriptions(customerId: number) {
    return this.prisma.subscriptionOrder.findMany({
      where: { customerId, status: { in: ['active', 'paused'] } },
      include: { box: { include: { items: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async pauseSubscription(id: number, reason?: string) {
    const sub = await this.prisma.subscriptionOrder.findUnique({
      where: { id },
      include: { box: true },
    });
    if (!sub) throw new NotFoundException('Subscription not found');
    if (sub.status === 'cancelled')
      throw new BadRequestException('Cannot pause a cancelled subscription');

    const newSkips = sub.consecutiveSkips + 1;

    if (newSkips >= sub.box.maxSkipConsecutive) {
      return this.prisma.subscriptionOrder.update({
        where: { id },
        data: { status: 'cancelled', consecutiveSkips: newSkips },
      });
    }

    return this.prisma.subscriptionOrder.update({
      where: { id },
      data: { status: 'paused', consecutiveSkips: newSkips },
    });
  }

  async cancelSubscription(id: number) {
    const sub = await this.prisma.subscriptionOrder.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException('Subscription not found');
    if (sub.status === 'cancelled') throw new BadRequestException('Already cancelled');

    return this.prisma.subscriptionOrder.update({
      where: { id },
      data: { status: 'cancelled' },
    });
  }

  async resumeSubscription(id: number) {
    const sub = await this.prisma.subscriptionOrder.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException('Subscription not found');
    if (sub.status !== 'paused')
      throw new BadRequestException('Only paused subscriptions can be resumed');

    return this.prisma.subscriptionOrder.update({
      where: { id },
      data: { status: 'active', consecutiveSkips: 0 },
    });
  }
}
