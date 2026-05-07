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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import {
  setInventorySchema,
  adjustInventorySchema,
  transferInventorySchema,
  nearestWarehouseSchema,
} from './dto/inventory.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { paginationSchema } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller('stores/:storeId/inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('merchant')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'List all inventory' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async listInventory(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Query() query: Record<string, any>,
  ) {
    const parsed = paginationSchema.safeParse(query);
    const params = parsed.success ? parsed.data : { limit: 20, sort: 'desc' as const };
    return this.inventoryService.listInventory(storeId, params);
  }

  @Get('warehouse/:warehouseId')
  @ApiOperation({ summary: 'List inventory for a warehouse' })
  async listByWarehouse(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('warehouseId', ParseIntPipe) warehouseId: number,
  ) {
    return this.inventoryService.listByWarehouse(storeId, warehouseId);
  }

  @Get('variant/:variantId')
  @ApiOperation({ summary: 'List inventory for a variant' })
  async listByVariant(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('variantId', ParseIntPipe) variantId: number,
  ) {
    return this.inventoryService.listByVariant(storeId, variantId);
  }

  @Get('nearest-warehouse')
  @ApiOperation({ summary: 'Find nearest warehouse with stock' })
  async findNearestWarehouse(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Query() query: Record<string, any>,
  ) {
    // Accept both camelCase (Postman) and snake_case query params
    const rawVariantIds = query.variant_ids ?? query.variantIds;
    const normalized = {
      variant_ids: Array.isArray(rawVariantIds)
        ? rawVariantIds
        : typeof rawVariantIds === 'string'
          ? rawVariantIds.split(',').map(Number)
          : [],
      customer_latitude: query.customer_latitude ?? query.customerLatitude,
      customer_longitude: query.customer_longitude ?? query.customerLongitude,
    };
    const parsed = nearestWarehouseSchema.safeParse(normalized);
    if (!parsed.success) {
      return { statusCode: 400, message: 'Invalid query parameters' };
    }
    return this.inventoryService.findNearestWarehouse(
      storeId,
      parsed.data.variant_ids,
      parsed.data.customer_latitude,
      parsed.data.customer_longitude,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(setInventorySchema))
  @ApiOperation({ summary: 'Set initial inventory' })
  async setInventory(@Param('storeId', ParseIntPipe) storeId: number, @Body() body: unknown) {
    const dto = body as any;
    return this.inventoryService.setInventory(storeId, {
      variantId: dto.variant_id,
      warehouseId: dto.warehouse_id,
      quantityAvailable: dto.quantity_available,
      lowStockThreshold: dto.low_stock_threshold ?? 5,
    });
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(adjustInventorySchema))
  @ApiOperation({ summary: 'Adjust inventory quantity' })
  async adjustInventory(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    const dto = body as { quantity_change: number };
    return this.inventoryService.adjustInventory(storeId, id, dto.quantity_change);
  }

  @Post('transfer')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(transferInventorySchema))
  @ApiOperation({ summary: 'Transfer stock between warehouses' })
  async transferInventory(@Param('storeId', ParseIntPipe) storeId: number, @Body() body: unknown) {
    const dto = body as any;
    return this.inventoryService.transferInventory(storeId, {
      variantId: dto.variant_id,
      fromWarehouseId: dto.from_warehouse_id,
      toWarehouseId: dto.to_warehouse_id,
      quantity: dto.quantity,
    });
  }
}
