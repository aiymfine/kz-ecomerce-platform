import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

/**
 * Registers recurring (cron-like) jobs using BullMQ's repeatable job feature.
 * Jobs are observable via BullMQ dashboard or the /admin/queue/status endpoint.
 *
 * Schedule:
 * - Abandoned cart check: every 15 minutes
 */
@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectQueue('abandoned-carts')
    private readonly abandonedCartQueue: Queue,
  ) {}

  async onModuleInit() {
    this.logger.log('Registering scheduled jobs...');

    try {
      // Remove existing repeatable jobs to avoid duplicates on restart
      const existing = await this.abandonedCartQueue.getRepeatableJobs();
      for (const job of existing) {
        await this.abandonedCartQueue.removeRepeatableByKey(job.key);
      }

      // Abandoned cart check: every 15 minutes
      await this.abandonedCartQueue.add(
        'check-all-stores',
        {},
        {
          repeat: {
            every: 15 * 60 * 1000, // 15 minutes
          },
          priority: 10,
        },
      );

      this.logger.log('Scheduled jobs registered:');
      this.logger.log('  - Abandoned cart check: every 15 minutes');
    } catch (error) {
      this.logger.warn(
        `Failed to register scheduled jobs (Redis may be unavailable): ${(error as Error).message}`,
      );
    }
  }
}
