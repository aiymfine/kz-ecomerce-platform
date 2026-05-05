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

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue('emails') private readonly emailQueue: Queue,
    @InjectQueue('abandoned-carts') private readonly abandonedCartQueue: Queue,
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
}
