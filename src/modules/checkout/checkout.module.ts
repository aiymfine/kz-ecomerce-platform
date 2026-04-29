import { Module } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { PaymentsModule } from '../payments/payments.module';
import { DiscountsModule } from '../discounts/discounts.module';

@Module({
  imports: [PrismaModule, PaymentsModule, DiscountsModule],
  providers: [CheckoutService],
  exports: [CheckoutService],
})
export class CheckoutModule {}
