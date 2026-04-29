import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { slugify } from '../../common/utils/slugify';
import { buildSku, countVariantCombinations } from '../../common/utils/sku-builder';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(private prisma: PrismaService) {}

  async listProducts(
    storeId: number,
    params: {
      status?: string;
      search?: string;
      categoryId?: number;
      cursor?: string;
      limit: number;
      sort: 'asc' | 'desc';
    },
  ) {
    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.categoryId) {
      where.categories = { some: { id: params.categoryId } };
    }

    const items = await this.prisma.withTenant(storeId, () =>
      this.prisma.product.findMany({
        where,
        take: params.limit + 1,
        cursor: params.cursor ? { id: parseInt(params.cursor) } : undefined,
        orderBy: { createdAt: params.sort === 'asc' ? 'asc' : 'desc' },
        include: {
          variants: {
            where: { isActive: true },
            take: 1,
            orderBy: { position: 'asc' },
          },
          _count: { select: { variants: true } },
        },
      }),
    );

    return {
      data: items.slice(0, params.limit),
      meta: {
        limit: params.limit,
        hasMore: items.length > params.limit,
        cursor:
          items.length > params.limit
            ? String(items[items.length - 1].id)
            : undefined,
      },
    };
  }

  async createProduct(
    storeId: number,
    data: {
      title: string;
      slug?: string;
      description?: string;
      status?: string;
      weightGrams?: number;
      allowBackorder?: boolean;
      lowStockAlert?: number;
      categoryIds?: number[];
    },
  ) {
    const slug = data.slug || slugify(data.title);

    // Check slug uniqueness within tenant
    const existing = await this.prisma.withTenant(storeId, () =>
      this.prisma.product.findUnique({ where: { slug } }),
    );
    if (existing) {
      return { error: 'CONFLICT', message: 'Product slug already exists' };
    }

    const product = await this.prisma.withTenant(storeId, () =>
      this.prisma.product.create({
        data: {
          title: data.title,
          slug,
          description: data.description,
          status: (data.status as any) || 'draft',
          weightGrams: data.weightGrams || 0,
          allowBackorder: data.allowBackorder || false,
          lowStockAlert: data.lowStockAlert || 5,
          categories: data.categoryIds
            ? {
                connect: data.categoryIds.map((id) => ({ id })),
              }
            : undefined,
        },
        include: { variants: true, categories: true },
      }),
    );

    return product;
  }

  async getProduct(storeId: number, productId: number) {
    const product = await this.prisma.withTenant(storeId, () =>
      this.prisma.product.findUnique({
        where: { id: productId },
        include: {
          variants: {
            include: {
              attributeValues: {
                include: { attribute: true },
              },
            },
            orderBy: { position: 'asc' },
          },
          images: { orderBy: { position: 'asc' } },
          categories: true,
        },
      }),
    );

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async updateProduct(
    storeId: number,
    productId: number,
    data: Record<string, unknown>,
  ) {
    const existing = await this.prisma.withTenant(storeId, () =>
      this.prisma.product.findUnique({ where: { id: productId } }),
    );

    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    const updateData: any = { ...data };
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key],
    );

    // Handle categoryIds separately
    if (updateData.categoryIds) {
      const categoryIds = updateData.categoryIds;
      delete updateData.categoryIds;

      return this.prisma.withTenant(storeId, () =>
        this.prisma.product.update({
          where: { id: productId },
          data: {
            ...updateData,
            categories: {
              set: categoryIds.map((id: number) => ({ id })),
            },
          },
          include: { variants: true, categories: true },
        }),
      );
    }

    return this.prisma.withTenant(storeId, () =>
      this.prisma.product.update({
        where: { id: productId },
        data: updateData,
        include: { variants: true, categories: true },
      }),
    );
  }

  async archiveProduct(storeId: number, productId: number) {
    const existing = await this.prisma.withTenant(storeId, () =>
      this.prisma.product.findUnique({ where: { id: productId } }),
    );

    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.withTenant(storeId, () =>
      this.prisma.product.update({
        where: { id: productId },
        data: { status: 'archived' },
      }),
    );
  }

  async updateVariant(
    storeId: number,
    productId: number,
    variantId: number,
    data: {
      sku?: string;
      priceTiyin?: number;
      compareAtPriceTiyin?: number;
      barcode?: string;
      weightGrams?: number;
      isActive?: boolean;
      position?: number;
    },
  ) {
    // Verify variant belongs to this product
    const variant = await this.prisma.withTenant(storeId, () =>
      this.prisma.productVariant.findFirst({
        where: { id: variantId, productId },
      }),
    );

    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    const updateData: any = {};
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.priceTiyin !== undefined) updateData.priceTiyin = data.priceTiyin;
    if (data.compareAtPriceTiyin !== undefined) updateData.compareAtPriceTiyin = data.compareAtPriceTiyin;
    if (data.barcode !== undefined) updateData.barcode = data.barcode;
    if (data.weightGrams !== undefined) updateData.weightGrams = data.weightGrams;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.position !== undefined) updateData.position = data.position;

    return this.prisma.withTenant(storeId, () =>
      this.prisma.productVariant.update({
        where: { id: variantId },
        data: updateData,
        include: { attributeValues: { include: { attribute: true } } },
      }),
    );
  }

  async deleteVariant(storeId: number, productId: number, variantId: number) {
    const variant = await this.prisma.withTenant(storeId, () =>
      this.prisma.productVariant.findFirst({
        where: { id: variantId, productId },
      }),
    );

    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    await this.prisma.withTenant(storeId, () =>
      this.prisma.productVariant.delete({ where: { id: variantId } }),
    );

    return { message: 'Variant deleted' };
  }

  async generateVariantMatrix(
    storeId: number,
    productId: number,
    data: {
      sizes?: string[];
      colors?: string[];
      materials?: string[];
      basePriceTiyin: number;
      compareAtPriceTiyin?: number;
    },
  ) {
    const product = await this.prisma.withTenant(storeId, () =>
      this.prisma.product.findUnique({ where: { id: productId } }),
    );

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const sizes = data.sizes || [];
    const colors = data.colors || [];
    const materials = data.materials || [];

    // Check max 100 combinations
    const totalCombinations = countVariantCombinations(sizes, colors, materials);
    if (totalCombinations > 100) {
      throw new BadRequestException(
        `Variant matrix would generate ${totalCombinations} combinations, maximum is 100`,
      );
    }

    if (totalCombinations === 0) {
      throw new BadRequestException(
        'At least one attribute (size, color, or material) is required',
      );
    }

    // Generate all combinations
    const combinations: {
      size?: string;
      color?: string;
      material?: string;
    }[] = [];

    for (const size of sizes.length ? sizes : [undefined]) {
      for (const color of colors.length ? colors : [undefined]) {
        for (const material of materials.length ? materials : [undefined]) {
          combinations.push({ size, color, material });
        }
      }
    }

    // Get or create attributes
    const variants: any[] = [];
    let position = 0;

    for (const combo of combinations) {
      const sku = buildSku({
        slug: product.slug,
        size: combo.size,
        color: combo.color,
        material: combo.material,
      });

      const variant = await this.prisma.withTenant(storeId, async () => {
        // Create attribute values
        const attributeValuesData: any[] = [];

        if (combo.size) {
          const attr = await this.prisma.variantAttribute.upsert({
            where: { id: await this.getOrCreateAttribute(storeId, 'size', 'Size') },
            create: { name: 'Size', type: 'size' },
            update: {},
          });
          attributeValuesData.push({
            attribute: { connect: { id: attr.id } },
            value: combo.size,
            sortOrder: 0,
          });
        }

        if (combo.color) {
          const attr = await this.prisma.variantAttribute.upsert({
            where: { id: await this.getOrCreateAttribute(storeId, 'color', 'Color') },
            create: { name: 'Color', type: 'color' },
            update: {},
          });
          attributeValuesData.push({
            attribute: { connect: { id: attr.id } },
            value: combo.color,
            sortOrder: 0,
          });
        }

        if (combo.material) {
          const attr = await this.prisma.variantAttribute.upsert({
            where: { id: await this.getOrCreateAttribute(storeId, 'material', 'Material') },
            create: { name: 'Material', type: 'material' },
            update: {},
          });
          attributeValuesData.push({
            attribute: { connect: { id: attr.id } },
            value: combo.material,
            sortOrder: 0,
          });
        }

        // Check SKU uniqueness
        const existingSku = await this.prisma.productVariant.findUnique({
          where: { sku },
        });
        if (existingSku) {
          return null; // Skip duplicate SKU
        }

        return this.prisma.productVariant.create({
          data: {
            productId,
            sku,
            priceTiyin: data.basePriceTiyin,
            compareAtPriceTiyin: data.compareAtPriceTiyin,
            position,
            attributeValues: {
              create: attributeValuesData,
            },
          },
          include: { attributeValues: { include: { attribute: true } } },
        });
      });

      if (variant) {
        variants.push(variant);
      }
      position++;
    }

    return { data: variants, totalGenerated: variants.length };
  }

  private async getOrCreateAttribute(
    storeId: number,
    type: string,
    name: string,
  ): Promise<number> {
    const existing = await this.prisma.withTenant(storeId, () =>
      this.prisma.variantAttribute.findFirst({ where: { type: type as any } }),
    );

    if (existing) return existing.id;

    const created = await this.prisma.withTenant(storeId, () =>
      this.prisma.variantAttribute.create({
        data: { name, type: type as any },
      }),
    );

    return created.id;
  }
}
