import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service';
import { QueueService } from '../queue.service';
import type { AbandonedCartJobData } from '../queue.service';

/**
 * Abandoned cart processor — marks stale carts and sends recovery notifications.
 * Registered in QueueModule as a processor for the 'abandoned-carts' queue.
 *
 * Job types:
 * - process-abandoned-cart: mark a specific cart as abandoned + notify customer
 * - check-all-stores: cron job that scans all tenant schemas for stale carts
 */
export class AbandonedCartQueueProcessor {
  private readonly logger = new Logger(AbandonedCartQueueProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
  ) {}

  async process(job: Job): Promise<void> {
    const jobName = job.name;

    if (jobName === 'check-all-stores') {
      return this.handleCheckAllStores();
    }

    if (jobName === 'process-abandoned-cart') {
      return this.handleProcessAbandonedCart(job as Job<AbandonedCartJobData>);
    }

    this.logger.warn(`Unknown job name: ${jobName}`);
  }

  private async handleProcessAbandonedCart(job: Job<AbandonedCartJobData>): Promise<void> {
    const { storeId, cartId, customerId } = job.data;
    this.logger.log(`Processing abandoned cart ${cartId} for store ${storeId}`);

    // Mark cart as abandoned in the tenant schema
    await this.prisma.withTenant(storeId, (client) =>
      client.cart.update({
        where: { id: cartId },
        data: { status: 'abandoned' },
      }),
    );

    // Get customer email for recovery notification
    const customer = await this.prisma.withTenant(storeId, (client) =>
      client.customer.findUnique({ where: { id: customerId } }),
    );

    if (customer) {
      try {
        await this.queueService.enqueueEmail({
          type: 'verification',
          to: customer.email,
          data: {
            message:
              'You left items in your cart! Complete your purchase before they sell out.',
          },
        });
      } catch {
        // Non-blocking — email queue may not be available
      }
    }

    this.logger.log(`Cart ${cartId} marked as abandoned for store ${storeId}`);
  }

  /**
   * Cron job: check all stores for carts abandoned >30 minutes.
   * Triggered by repeatable BullMQ job registered in SchedulerService.
   */
  private async handleCheckAllStores(): Promise<void> {
    this.logger.log('Running abandoned cart check for all stores...');

    const stores = await this.prisma.store.findMany({
      where: { status: 'active' },
    });

    let totalAbandoned = 0;

    for (const store of stores) {
      try {
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

        const abandonedCarts = await this.prisma.withTenant(store.id, (client) =>
          client.cart.findMany({
            where: {
              status: 'active',
              updatedAt: { lt: thirtyMinutesAgo },
            },
          }),
        );

        for (const cart of abandonedCarts) {
          await this.queueService.enqueueAbandonedCartCheck({
            storeId: store.id,
            cartId: cart.id,
            customerId: cart.customerId,
          });
          totalAbandoned++;
        }
      } catch (error) {
        this.logger.error(
          `Failed to check abandoned carts for store ${store.id}: ${(error as Error).message}`,
        );
      }
    }

    this.logger.log(
      `Abandoned cart check complete. Found ${totalAbandoned} abandoned carts across ${stores.length} stores.`,
    );
  }
}
