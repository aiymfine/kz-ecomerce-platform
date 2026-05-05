import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        const connection = redisUrl
          ? { url: redisUrl }
          : {
              host: '127.0.0.1',
              port: 6379,
              connectTimeout: 3000,
              maxRetriesPerRequest: 1,
              retryStrategy: () => null, // Don't retry — fail fast when Redis is unavailable
            };
        return {
          connection,
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
    ),
  ],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
