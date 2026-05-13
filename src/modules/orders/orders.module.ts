import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { QueueModule } from '../../common/queue/queue.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET_KEY'),
        signOptions: { expiresIn: `${config.get<number>('JWT_ACCESS_TOKEN_EXPIRE_MINUTES', 30)}m` },
      }),
    }),
    forwardRef(() => WebhooksModule),
    QueueModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
