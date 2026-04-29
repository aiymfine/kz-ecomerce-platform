import { Controller, Get, Query, UsePipes } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { analyticsDateRangeSchema } from './dto/analytics.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get('sales')
  @UsePipes(new ZodValidationPipe(analyticsDateRangeSchema))
  sales(@Query() query: any) {
    return this.service.getSales(query);
  }

  @Get('products')
  products() {
    return this.service.getProducts();
  }

  @Get('customers')
  @UsePipes(new ZodValidationPipe(analyticsDateRangeSchema))
  customers(@Query() query: any) {
    return this.service.getCustomers(query);
  }

  @Get('inventory')
  inventory() {
    return this.service.getInventory();
  }
}
