import { Controller, Get, Query, UseGuards, UsePipes } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { analyticsDateRangeSchema } from './dto/analytics.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('merchant')
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
