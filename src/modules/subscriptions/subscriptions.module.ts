import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import {
  SubscriptionBoxesController,
  SubscriptionsController,
} from './subscriptions.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SubscriptionBoxesController, SubscriptionsController],
  providers: [SubscriptionsService],
})
export class SubscriptionsModule {}
