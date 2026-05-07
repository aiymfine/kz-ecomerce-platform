import { Injectable } from '@nestjs/common';
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
  constructor(
    @InjectQueue('emails') private readonly emailQueue: Queue,
    @InjectQueue('abandoned-carts') private readonly abandonedCartQueue: Queue,
    @InjectQueue('webhook-deliveries') private readonly webhookQueue: Queue,
  ) {}

  async enqueueEmail(job: EmailJobData): Promise<string> {
    const result = await this.emailQueue.add('send-email', job);
    return result.id || '';
  }

  async enqueueAbandonedCartCheck(job: AbandonedCartJobData): Promise<string> {
    const result = await this.abandonedCartQueue.add('process-abandoned-cart', job, {
      delay: 30 * 60 * 1000, // 30 minutes
    });
    return result.id || '';
  }

  async enqueueWebhookDelivery(job: WebhookDeliveryJobData): Promise<string> {
    const result = await this.webhookQueue.add('deliver-webhook', job, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { count: 200 },
      removeOnFail: { count: 100 },
    });
    return result.id || '';
  }
}
