import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DiscountsService } from './discounts.service';
import {
  createPromoCodeSchema,
  updatePromoCodeSchema,
  validatePromoCodeSchema,
} from './dto/discount.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { paginationSchema } from '../../common/dto/pagination.dto';

@ApiTags('Promo Codes')
@ApiBearerAuth()
@Controller('stores/:storeId/promo-codes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('merchant')
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(createPromoCodeSchema))
  @ApiOperation({ summary: 'Create a promo code' })
  @ApiResponse({ status: 201, description: 'Promo code created' })
  async createPromoCode(@Param('storeId', ParseIntPipe) storeId: number, @Body() body: unknown) {
    const dto = body as any;
    return this.discountsService.createPromoCode(storeId, {
      code: dto.code,
      type: dto.type,
      value: dto.value,
      minOrderTiyin: dto.min_order_tiyin,
      maxUses: dto.max_uses,
      maxPerCustomer: dto.max_per_customer,
      isStackable: dto.is_stackable,
      firstBuyerOnly: dto.first_buyer_only,
      startsAt: dto.starts_at,
      expiresAt: dto.expires_at,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List promo codes' })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of promo codes' })
  async listPromoCodes(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Query() query: Record<string, any>,
  ) {
    const parsed = paginationSchema.safeParse(query);
    const params = parsed.success ? parsed.data : { limit: 20 };
    return this.discountsService.listPromoCodes(storeId, params);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get promo code details' })
  @ApiResponse({ status: 200, description: 'Promo code details' })
  async getPromoCode(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.discountsService.getPromoCode(storeId, id);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updatePromoCodeSchema))
  @ApiOperation({ summary: 'Update promo code' })
  @ApiResponse({ status: 200, description: 'Promo code updated' })
  async updatePromoCode(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    return this.discountsService.updatePromoCode(storeId, id, body as Record<string, unknown>);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete promo code' })
  @ApiResponse({ status: 200, description: 'Promo code deactivated' })
  async deletePromoCode(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.discountsService.deletePromoCode(storeId, id);
  }

  @Post(':code/validate')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(validatePromoCodeSchema))
  @ApiOperation({ summary: 'Validate a promo code against a cart' })
  @ApiResponse({ status: 200, description: 'Validation result' })
  async validatePromoCode(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('code') code: string,
    @Body() body: unknown,
  ) {
    const dto = body as any;
    return this.discountsService.validatePromoCode(storeId, {
      code,
      cartSubtotalTiyin: dto.cart_subtotal_tiyin,
      customerId: dto.customer_id,
    });
  }
}
