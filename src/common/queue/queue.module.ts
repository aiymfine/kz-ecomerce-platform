import { Global, Module, Logger } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';
import { SchedulerService } from './scheduler.service';

const REDIS_AVAILABLE = process.env.REDIS_URL;

@Global()
@Module({
  imports: REDIS_AVAILABLE
    ? [
        BullModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => {
            const redisUrl = configService.get<string>('REDIS_URL');
            return {
              connection: { url: redisUrl },
              defaultJobOptions: {
                removeOnComplete: { count: 100 },
                removeOnFail: { count: 50 },
                attempts: 3,
                backoff: { type: 'exponential', delay: 2000 },
              },
            };
          },
        }),
        BullModule.registerQueue(
          { name: 'emails' },
          { name: 'abandoned-carts' },
          { name: 'webhook-deliveries' },
        ),
      ]
    : [],
  providers: [QueueService, SchedulerService],
  exports: [QueueService],
})
export class QueueModule {
  private readonly logger = new Logger(QueueModule.name);

  constructor() {
    if (!REDIS_AVAILABLE) {
      this.logger.warn('REDIS_URL not set — BullMQ queues disabled, using no-op QueueService');
    }
  }
}
