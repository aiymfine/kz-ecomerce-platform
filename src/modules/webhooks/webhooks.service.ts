import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class WebhooksService {
  constructor(private prisma: PrismaService) {}

  async listWebhooks(storeId: number) {
    return this.prisma.withTenant(storeId, () =>
      this.prisma.webhook.findMany({
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  async getWebhook(storeId: number, webhookId: number) {
    const webhook = await this.prisma.withTenant(storeId, () =>
      this.prisma.webhook.findUnique({ where: { id: webhookId } }),
    );

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    return webhook;
  }

  async createWebhook(
    storeId: number,
    data: { url: string; events: string[]; isActive?: boolean },
  ) {
    const secret = randomBytes(32).toString('hex');

    const webhook = await this.prisma.withTenant(storeId, () =>
      this.prisma.webhook.create({
        data: {
          url: data.url,
          events: data.events as any,
          secret,
          isActive: data.isActive !== false,
        },
      }),
    );

    return {
      ...webhook,
      secret, // Show secret only once
    };
  }

  async updateWebhook(
    storeId: number,
    webhookId: number,
    data: { url?: string; events?: string[]; isActive?: boolean },
  ) {
    const existing = await this.prisma.withTenant(storeId, () =>
      this.prisma.webhook.findUnique({ where: { id: webhookId } }),
    );

    if (!existing) {
      throw new NotFoundException('Webhook not found');
    }

    const updateData: any = {};
    if (data.url !== undefined) updateData.url = data.url;
    if (data.events !== undefined) updateData.events = data.events;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return this.prisma.withTenant(storeId, () =>
      this.prisma.webhook.update({
        where: { id: webhookId },
        data: updateData,
      }),
    );
  }

  async deleteWebhook(storeId: number, webhookId: number) {
    const existing = await this.prisma.withTenant(storeId, () =>
      this.prisma.webhook.findUnique({ where: { id: webhookId } }),
    );

    if (!existing) {
      throw new NotFoundException('Webhook not found');
    }

    await this.prisma.withTenant(storeId, () =>
      this.prisma.webhook.delete({ where: { id: webhookId } }),
    );

    return { message: 'Webhook deleted' };
  }

  async getWebhookEvents(
    storeId: number,
    webhookId: number,
    params: { status?: string; cursor?: string; limit: number },
  ) {
    const webhook = await this.prisma.withTenant(storeId, () =>
      this.prisma.webhook.findUnique({ where: { id: webhookId } }),
    );

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    const where: any = { webhookId };
    if (params.status) where.status = params.status;

    const items = await this.prisma.withTenant(storeId, () =>
      this.prisma.webhookEvent.findMany({
        where,
        take: params.limit + 1,
        cursor: params.cursor ? { id: parseInt(params.cursor) } : undefined,
        orderBy: { createdAt: 'desc' },
      }),
    );

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
}
