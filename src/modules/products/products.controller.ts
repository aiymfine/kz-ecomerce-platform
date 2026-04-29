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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CategoriesService } from './categories.service';
import {
  createProductSchema,
  updateProductSchema,
  productFilterSchema,
  generateVariantsSchema,
  createCategorySchema,
  updateCategorySchema,
  categoryFilterSchema,
} from './dto/product.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/guards/jwt-auth.guard';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('stores/:storeId/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('merchant')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List products in a store' })
  @ApiQuery({ name: 'status', required: false, enum: ['draft', 'active', 'archived'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'List of products' })
  async listProducts(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Query() query: Record<string, any>,
  ) {
    const parsed = productFilterSchema.safeParse(query);
    if (!parsed.success) {
      return { statusCode: 400, message: 'Invalid query parameters' };
    }
    return this.productsService.listProducts(storeId, parsed.data);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(createProductSchema))
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created' })
  @ApiResponse({ status: 409, description: 'Slug already exists' })
  async createProduct(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body() body: unknown,
  ) {
    const result = await this.productsService.createProduct(storeId, body as any);
    if (result && typeof result === 'object' && 'error' in result) {
      const statusMap: Record<string, number> = { CONFLICT: 409 };
      return { statusCode: statusMap[(result as any).error] || 400, ...result };
    }
    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product details with variants' })
  @ApiResponse({ status: 200, description: 'Product details' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProduct(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.productsService.getProduct(storeId, id);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updateProductSchema))
  @ApiOperation({ summary: 'Update product' })
  @ApiResponse({ status: 200, description: 'Product updated' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async updateProduct(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    return this.productsService.updateProduct(storeId, id, body as any);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive product (soft delete)' })
  @ApiResponse({ status: 200, description: 'Product archived' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async archiveProduct(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.productsService.archiveProduct(storeId, id);
  }

  @Post(':id/variants')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(generateVariantsSchema))
  @ApiOperation({ summary: 'Generate variant matrix from Size×Color×Material' })
  @ApiResponse({ status: 201, description: 'Variants generated' })
  @ApiResponse({ status: 400, description: 'Too many combinations or invalid input' })
  async generateVariants(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    return this.productsService.generateVariantMatrix(storeId, id, body as any);
  }

  @Patch(':id/variants/:variantId')
  @ApiOperation({ summary: 'Update variant price, weight, barcode' })
  @ApiResponse({ status: 200, description: 'Variant updated' })
  @ApiResponse({ status: 404, description: 'Variant not found' })
  async updateVariant(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('id', ParseIntPipe) id: number,
    @Param('variantId', ParseIntPipe) variantId: number,
    @Body() body: any,
  ) {
    return this.productsService.updateVariant(storeId, id, variantId, body);
  }

  @Delete(':id/variants/:variantId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete variant' })
  @ApiResponse({ status: 200, description: 'Variant deleted' })
  @ApiResponse({ status: 404, description: 'Variant not found' })
  async deleteVariant(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('id', ParseIntPipe) id: number,
    @Param('variantId', ParseIntPipe) variantId: number,
  ) {
    return this.productsService.deleteVariant(storeId, id, variantId);
  }
}

@ApiTags('Categories')
@ApiBearerAuth()
@Controller('stores/:storeId/categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('merchant')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List categories (flat or tree)' })
  @ApiQuery({ name: 'tree', required: false, type: Boolean })
  @ApiQuery({ name: 'parentId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of categories' })
  async listCategories(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Query() query: Record<string, any>,
  ) {
    const parsed = categoryFilterSchema.safeParse(query);
    const params = parsed.success
      ? parsed.data
      : { tree: false, limit: 50 };
    return this.categoriesService.listCategories(storeId, params);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(createCategorySchema))
  @ApiOperation({ summary: 'Create a category' })
  @ApiResponse({ status: 201, description: 'Category created' })
  async createCategory(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body() body: unknown,
  ) {
    const result = await this.categoriesService.createCategory(storeId, body as any);
    if (result && typeof result === 'object' && 'error' in result) {
      return { statusCode: 404, ...result };
    }
    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category with children' })
  @ApiResponse({ status: 200, description: 'Category details' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getCategory(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.categoriesService.getCategory(storeId, id);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updateCategorySchema))
  @ApiOperation({ summary: 'Update category' })
  @ApiResponse({ status: 200, description: 'Category updated' })
  async updateCategory(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    return this.categoriesService.updateCategory(storeId, id, body as any);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete category (must be empty)' })
  @ApiResponse({ status: 200, description: 'Category deleted' })
  @ApiResponse({ status: 400, description: 'Category has subcategories or products' })
  async deleteCategory(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.categoriesService.deleteCategory(storeId, id);
  }
}
