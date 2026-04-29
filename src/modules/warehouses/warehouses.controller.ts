import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UsePipes,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WarehousesService } from './warehouses.service';
import { createWarehouseSchema, updateWarehouseSchema } from './dto/warehouse.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller('stores/:storeId/warehouses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('merchant')
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Get()
  @ApiOperation({ summary: 'List warehouses' })
  @ApiResponse({ status: 200, description: 'List of warehouses' })
  async listWarehouses(@Param('storeId', ParseIntPipe) storeId: number) {
    return this.warehousesService.listWarehouses(storeId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(createWarehouseSchema))
  @ApiOperation({ summary: 'Create a warehouse' })
  @ApiResponse({ status: 201, description: 'Warehouse created' })
  async createWarehouse(@Param('storeId', ParseIntPipe) storeId: number, @Body() body: unknown) {
    return this.warehousesService.createWarehouse(storeId, body as any);
  }

  @Get(':warehouseId')
  @ApiOperation({ summary: 'Get warehouse details' })
  @ApiResponse({ status: 200, description: 'Warehouse details' })
  @ApiResponse({ status: 404, description: 'Warehouse not found' })
  async getWarehouse(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('warehouseId', ParseIntPipe) warehouseId: number,
  ) {
    return this.warehousesService.getWarehouse(storeId, warehouseId);
  }

  @Patch(':warehouseId')
  @UsePipes(new ZodValidationPipe(updateWarehouseSchema))
  @ApiOperation({ summary: 'Update warehouse' })
  @ApiResponse({ status: 200, description: 'Warehouse updated' })
  @ApiResponse({ status: 404, description: 'Warehouse not found' })
  async updateWarehouse(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('warehouseId', ParseIntPipe) warehouseId: number,
    @Body() body: unknown,
  ) {
    return this.warehousesService.updateWarehouse(storeId, warehouseId, body as any);
  }

  @Delete(':warehouseId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete warehouse (must have no inventory)' })
  @ApiResponse({ status: 200, description: 'Warehouse deleted' })
  @ApiResponse({ status: 409, description: 'Warehouse has inventory records' })
  async deleteWarehouse(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('warehouseId', ParseIntPipe) warehouseId: number,
  ) {
    return this.warehousesService.deleteWarehouse(storeId, warehouseId);
  }
}
