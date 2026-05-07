import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmailService } from '../../../modules/email/email.service';
import type { EmailJobData } from '../queue.service';

/**
 * Email queue processor — handles all outgoing emails asynchronously via BullMQ.
 * Registered in QueueModule as a processor for the 'emails' queue.
 *
 * Supported job types:
 * - verification: 6-digit code email on registration
 * - password-reset: reset link email
 * - order-confirmation: order summary after checkout
 * - payment-receipt: payment confirmation after successful payment
 */
export class EmailQueueProcessor {
  private readonly logger = new Logger(EmailQueueProcessor.name);

  constructor(private readonly emailService: EmailService) {}

  async process(job: Job<EmailJobData>): Promise<void> {
    const { type, to, data } = job.data;
    this.logger.log(`Processing email job ${job.id}: type=${type}, to=${to}`);

    switch (type) {
      case 'verification':
        await this.emailService.sendVerificationEmail(to, data.code as string);
        break;

      case 'password-reset':
        await this.emailService.sendPasswordResetEmail(to, data.resetLink as string);
        break;

      case 'order-confirmation':
        await this.emailService.sendOrderConfirmation(to, {
          orderNumber: data.orderNumber as string,
          items: (data.items || []) as Array<{
            title: string;
            sku: string;
            quantity: number;
            price: number;
          }>,
          total: data.total as number,
          currency: (data.currency as string) || 'KZT',
        });
        break;

      case 'payment-receipt':
        await this.emailService.sendPaymentReceipt(to, {
          orderNumber: data.orderNumber as string,
          amount: data.amount as number,
          provider: data.provider as string,
          transactionId: data.transactionId as string | undefined,
          currency: (data.currency as string) || 'KZT',
        });
        break;

      default:
        throw new Error(`Unknown email job type: ${type}`);
    }
  }
}
