import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export interface EmailJobData {
  type: 'verification' | 'password-reset' | 'order-confirmation' | 'payment-receipt';
  to: string;
  data: Record<string, unknown>;
}

export interface AbandonedCartJobData {
  storeId: number;
  cartId: number;
  customerId: number;
}

export interface WebhookDeliveryJobData {
  webhookEventId: number;
  storeId: number;
  webhookId: number;
  eventType: string;
  payload: any;
  url: string;
  secret: string;
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  private readonly available: boolean;

  constructor(
    @Optional() @InjectQueue('emails') private readonly emailQueue?: Queue,
    @Optional() @InjectQueue('abandoned-carts') private readonly abandonedCartQueue?: Queue,
    @Optional() @InjectQueue('webhook-deliveries') private readonly webhookQueue?: Queue,
  ) {
    this.available = !!(this.emailQueue && this.abandonedCartQueue && this.webhookQueue);
    if (!this.available) {
      this.logger.warn('QueueService running in no-op mode (Redis/BullMQ not available)');
    }
  }

  async enqueueEmail(job: EmailJobData): Promise<string> {
    if (!this.available || !this.emailQueue) {
      this.logger.debug(`No-op enqueueEmail: ${job.type} → ${job.to}`);
      return '';
    }
    const result = await this.emailQueue.add('send-email', job);
    return result.id || '';
  }

  async enqueueAbandonedCartCheck(job: AbandonedCartJobData): Promise<string> {
    if (!this.available || !this.abandonedCartQueue) {
      this.logger.debug(`No-op enqueueAbandonedCartCheck: store=${job.storeId}`);
      return '';
    }
    const result = await this.abandonedCartQueue.add('process-abandoned-cart', job, {
      delay: 30 * 60 * 1000, // 30 minutes
    });
    return result.id || '';
  }

  async enqueueWebhookDelivery(job: WebhookDeliveryJobData): Promise<string> {
    if (!this.available || !this.webhookQueue) {
      this.logger.debug(`No-op enqueueWebhookDelivery: ${job.eventType} → ${job.url}`);
      return '';
    }
    const result = await this.webhookQueue.add('deliver-webhook', job, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { count: 200 },
      removeOnFail: { count: 100 },
    });
    return result.id || '';
  }
}
