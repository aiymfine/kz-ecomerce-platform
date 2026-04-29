import {
  Controller,
  Post,
  Get,
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
import { StorefrontService } from './storefront.service';
import {
  customerRegisterSchema,
  customerLoginSchema,
  storefrontRefreshTokenSchema,
  storefrontProductFilterSchema,
} from './dto/storefront.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/guards/jwt-auth.guard';

@ApiTags('Storefront')
@Controller('storefront')
export class StorefrontController {
  constructor(private readonly storefrontService: StorefrontService) {}

  // ---- Auth endpoints ----

  @Post('auth/register')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(customerRegisterSchema))
  @ApiOperation({ summary: 'Customer registration' })
  @ApiResponse({ status: 201, description: 'Customer registered' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(
    @Query('storeId', ParseIntPipe) storeId: number,
    @Body() body: unknown,
  ) {
    const result = await this.storefrontService.register(storeId, body as any);
    if (result.error) {
      const statusMap: Record<string, number> = { CONFLICT: 409 };
      return { statusCode: statusMap[result.error] || 400, ...result };
    }
    return result;
  }

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(customerLoginSchema))
  @ApiOperation({ summary: 'Customer login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Query('storeId', ParseIntPipe) storeId: number,
    @Body() body: unknown,
  ) {
    const result = await this.storefrontService.login(storeId, body as any);
    if (result.error) {
      const statusMap: Record<string, number> = { UNAUTHORIZED: 401 };
      return { statusCode: statusMap[result.error] || 400, ...result };
    }
    return result;
  }

  @Post('auth/refresh')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(storefrontRefreshTokenSchema))
  @ApiOperation({ summary: 'Refresh customer token' })
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid token' })
  async refresh(@Body() body: unknown) {
    const result = await this.storefrontService.refreshToken((body as any).refreshToken);
    if (result.error) {
      return { statusCode: 401, ...result };
    }
    return result;
  }

  @Post('auth/logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Customer logout' })
  @ApiResponse({ status: 200, description: 'Logged out' })
  async logout(@Body('refreshToken') refreshToken: string) {
    return this.storefrontService.logout(refreshToken);
  }

  // ---- Public browsing endpoints ----

  @Get('products')
  @ApiOperation({ summary: 'Public product listing' })
  @ApiQuery({ name: 'storeId', required: true, type: Number })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Product list' })
  async listProducts(
    @Query('storeId', ParseIntPipe) storeId: number,
    @Query() query: Record<string, any>,
  ) {
    const parsed = storefrontProductFilterSchema.safeParse(query);
    const params = parsed.success ? parsed.data : { limit: 20, sort: 'desc' as const };
    return this.storefrontService.listProducts(storeId, params);
  }

  @Get('products/:slug')
  @ApiOperation({ summary: 'Get product by slug' })
  @ApiQuery({ name: 'storeId', required: true, type: Number })
  @ApiResponse({ status: 200, description: 'Product details' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProduct(
    @Query('storeId', ParseIntPipe) storeId: number,
    @Param('slug') slug: string,
  ) {
    const result = await this.storefrontService.getProductBySlug(storeId, slug) as any;
    if (result.error) {
      return { statusCode: 404, ...result };
    }
    return result;
  }

  @Get('categories')
  @ApiOperation({ summary: 'Public category tree' })
  @ApiQuery({ name: 'storeId', required: true, type: Number })
  @ApiResponse({ status: 200, description: 'Category tree' })
  async listCategories(@Query('storeId', ParseIntPipe) storeId: number) {
    return this.storefrontService.listCategories(storeId);
  }

  @Get('categories/:slug/products')
  @ApiOperation({ summary: 'Products in category' })
  @ApiQuery({ name: 'storeId', required: true, type: Number })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Products in category' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getCategoryProducts(
    @Query('storeId', ParseIntPipe) storeId: number,
    @Param('slug') slug: string,
    @Query() query: Record<string, any>,
  ) {
    const parsed = storefrontProductFilterSchema.safeParse(query);
    const params = parsed.success ? parsed.data : { limit: 20, sort: 'desc' as const };
    const result = await this.storefrontService.getCategoryProducts(storeId, slug, params);
    if (result && typeof result === 'object' && 'error' in result) {
      return { statusCode: 404, ...result };
    }
    return result;
  }
}
