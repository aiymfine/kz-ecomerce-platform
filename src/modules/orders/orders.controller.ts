import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import {
  updateOrderStatusSchema,
  createFulfillmentSchema,
  updateFulfillmentSchema,
  orderFilterSchema,
  checkoutSchema,
} from './dto/order.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { StoreOwnershipGuard } from '../../common/guards/store-ownership.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/guards/jwt-auth.guard';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('stores/:storeId/orders')
@UseGuards(JwtAuthGuard, RolesGuard, StoreOwnershipGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  @HttpCode(HttpStatus.CREATED)
  @Roles('merchant', 'customer')
  @UsePipes(new ZodValidationPipe(checkoutSchema))
  @ApiOperation({ summary: 'Checkout — create order from active cart' })
  async checkout(
    @Param('storeId', ParseIntPipe) storeId: number,
    @CurrentUser() user: JwtPayload,
    @Body() body: unknown,
  ) {
    const dto = body as { shipping_method?: string; shipping_address?: string; notes?: string };
    return this.ordersService.checkout(storeId, user.sub, {
      shippingMethod: (dto.shipping_method as any) || 'self_pickup',
      shippingAddress: dto.shipping_address,
      notes: dto.notes,
    });
  }

  @Get()
  @Roles('merchant', 'customer')
  @ApiOperation({ summary: 'List orders' })
  async listOrders(
    @Param('storeId', ParseIntPipe) storeId: number,
    @CurrentUser() user: JwtPayload,
    @Query() query: Record<string, any>,
  ) {
    const parsed = orderFilterSchema.safeParse(query);
    const params = parsed.success ? parsed.data : { limit: 20, sort: 'desc' as const };
    return this.ordersService.listOrders(storeId, params, user);
  }

  @Get(':orderNumber')
  @ApiOperation({ summary: 'Get order by order number' })
  async getOrder(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('orderNumber') orderNumber: string,
  ) {
    return this.ordersService.getOrderByNumber(storeId, orderNumber);
  }

  @Patch(':id/status')
  @UsePipes(new ZodValidationPipe(updateOrderStatusSchema))
  @ApiOperation({ summary: 'Update order status' })
  async updateStatus(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    const dto = body as { status: any };
    return this.ordersService.updateOrderStatus(storeId, id, dto.status);
  }

  @Post(':id/fulfill')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(createFulfillmentSchema))
  @ApiOperation({ summary: 'Create fulfillment' })
  async createFulfillment(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    const dto = body as {
      warehouse_id: number;
      items: { order_item_id: number; quantity: number }[];
    };
    return this.ordersService.createFulfillment(storeId, id, {
      warehouseId: dto.warehouse_id,
      items: dto.items,
    });
  }

  @Patch(':id/fulfillments/:fulfillmentId')
  @UsePipes(new ZodValidationPipe(updateFulfillmentSchema))
  @ApiOperation({ summary: 'Update fulfillment' })
  async updateFulfillment(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('id', ParseIntPipe) id: number,
    @Param('fulfillmentId', ParseIntPipe) fulfillmentId: number,
    @Body() body: unknown,
  ) {
    const dto = body as { tracking_number?: string; status?: string };
    return this.ordersService.updateFulfillment(storeId, id, fulfillmentId, dto);
  }
}
