import { Module } from '@nestjs/common';
import { AbandonedCartsService } from './abandoned-carts.service';
import { AbandonedCartsController } from './abandoned-carts.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AbandonedCartsController],
  providers: [AbandonedCartsService],
})
export class AbandonedCartsModule {}
