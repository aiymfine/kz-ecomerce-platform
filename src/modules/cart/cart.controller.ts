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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { addCartItemSchema, updateCartItemSchema } from './dto/cart.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/guards/jwt-auth.guard';

@ApiTags('Cart')
@ApiBearerAuth()
@Controller('stores/:storeId/cart')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get current customer active cart' })
  async getCart(@Param('storeId', ParseIntPipe) storeId: number, @CurrentUser() user: JwtPayload) {
    return this.cartService.getCart(storeId, user.sub);
  }

  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(addCartItemSchema))
  @ApiOperation({ summary: 'Add item to cart' })
  async addItem(
    @Param('storeId', ParseIntPipe) storeId: number,
    @CurrentUser() user: JwtPayload,
    @Body() body: unknown,
  ) {
    const dto = body as { variant_id: number; quantity: number };
    return this.cartService.addItem(storeId, user.sub, dto.variant_id, dto.quantity);
  }

  @Patch('items/:id')
  @UsePipes(new ZodValidationPipe(updateCartItemSchema))
  @ApiOperation({ summary: 'Update cart item quantity' })
  async updateItem(
    @Param('storeId', ParseIntPipe) storeId: number,
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    const dto = body as { quantity: number };
    return this.cartService.updateItemQuantity(storeId, user.sub, id, dto.quantity);
  }

  @Delete('items/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove item from cart' })
  async removeItem(
    @Param('storeId', ParseIntPipe) storeId: number,
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.cartService.removeItem(storeId, user.sub, id);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear all cart items' })
  async clearCart(
    @Param('storeId', ParseIntPipe) storeId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.cartService.clearCart(storeId, user.sub);
  }
}
