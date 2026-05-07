import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueueService, WebhookDeliveryJobData } from '../../common/queue/queue.service';
import { randomBytes } from 'crypto';

@Injectable()
export class WebhooksService {
  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
  ) {}

  async listWebhooks(storeId: number) {
    return this.prisma.withTenant(storeId, (client) =>
      client.webhook.findMany({
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  async getWebhook(storeId: number, webhookId: number) {
    const webhook = await this.prisma.withTenant(storeId, (client) =>
      client.webhook.findUnique({ where: { id: webhookId } }),
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

    const webhook = await this.prisma.withTenant(storeId, (client) =>
      client.webhook.create({
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
    const existing = await this.prisma.withTenant(storeId, (client) =>
      client.webhook.findUnique({ where: { id: webhookId } }),
    );

    if (!existing) {
      throw new NotFoundException('Webhook not found');
    }

    const updateData: any = {};
    if (data.url !== undefined) updateData.url = data.url;
    if (data.events !== undefined) updateData.events = data.events;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return this.prisma.withTenant(storeId, (client) =>
      client.webhook.update({
        where: { id: webhookId },
        data: updateData,
      }),
    );
  }

  async deleteWebhook(storeId: number, webhookId: number) {
    const existing = await this.prisma.withTenant(storeId, (client) =>
      client.webhook.findUnique({ where: { id: webhookId } }),
    );

    if (!existing) {
      throw new NotFoundException('Webhook not found');
    }

    await this.prisma.withTenant(storeId, (client) =>
      client.webhook.delete({ where: { id: webhookId } }),
    );

    return { message: 'Webhook deleted' };
  }

  async getWebhookEvents(
    storeId: number,
    webhookId: number,
    params: { status?: string; cursor?: string; limit: number },
  ) {
    const webhook = await this.prisma.withTenant(storeId, (client) =>
      client.webhook.findUnique({ where: { id: webhookId } }),
    );

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    const where: any = { webhookId };
    if (params.status) where.status = params.status;

    const items = await this.prisma.withTenant(storeId, (client) =>
      client.webhookEvent.findMany({
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
        cursor: items.length > params.limit ? String(items[items.length - 1].id) : undefined,
      },
    };
  }

  /**
   * Fire a webhook event to all active webhooks that listen for this event type.
   * Creates a WebhookEvent record and enqueues delivery via BullMQ.
   *
   * Usage from other modules:
   *   this.webhooksService.fireEvent(storeId, 'order.created', { orderId: 123 });
   */
  async fireEvent(storeId: number, eventType: string, payload: any) {
    // Find all active webhooks for this store that listen for this event
    const webhooks = await this.prisma.withTenant(storeId, (client) =>
      client.webhook.findMany({
        where: { isActive: true },
      }),
    );

    const results = [];

    for (const webhook of webhooks) {
      const events = Array.isArray(webhook.events) ? webhook.events : [];
      if (!events.includes(eventType) && !events.includes('*')) {
        continue; // This webhook doesn't listen for this event
      }

      // Create the webhook event record
      const event = await this.prisma.withTenant(storeId, (client) =>
        client.webhookEvent.create({
          data: {
            webhookId: webhook.id,
            eventType,
            payload: payload as any,
            status: 'pending',
            maxAttempts: 5,
          },
        }),
      );

      // Enqueue delivery via BullMQ
      const jobData: WebhookDeliveryJobData = {
        webhookEventId: event.id,
        storeId,
        webhookId: webhook.id,
        eventType,
        payload,
        url: webhook.url,
        secret: webhook.secret,
      };

      try {
        await this.queueService.enqueueWebhookDelivery(jobData);
        results.push({ webhookId: webhook.id, eventId: event.id, status: 'queued' });
      } catch (err) {
        console.error(`[WebhooksService] Failed to enqueue delivery for webhook ${webhook.id}:`, err);
        results.push({ webhookId: webhook.id, eventId: event.id, status: 'enqueue_failed' });
      }
    }

    return results;
  }
}
