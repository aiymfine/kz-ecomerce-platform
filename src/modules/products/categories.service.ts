import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { slugify } from '../../common/utils/slugify';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async listCategories(
    storeId: number,
    params: { tree?: boolean; parentId?: number; limit: number },
  ) {
    if (params.tree) {
      return this.getCategoryTree(storeId);
    }

    const where: any = {};
    if (params.parentId !== undefined) {
      where.parentId = params.parentId;
    }

    const items = await this.prisma.withTenant(storeId, () =>
      this.prisma.category.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        take: params.limit,
      }),
    );

    return { data: items };
  }

  async getCategoryTree(storeId: number) {
    const categories = await this.prisma.withTenant(storeId, () =>
      this.prisma.category.findMany({
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
    );

    // Build tree from flat list
    const map = new Map<number, any>();
    const roots: any[] = [];

    for (const cat of categories) {
      map.set(cat.id, { ...cat, children: [] });
    }

    for (const cat of categories) {
      const node = map.get(cat.id)!;
      if (cat.parentId && map.has(cat.parentId)) {
        map.get(cat.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return { data: roots };
  }

  async getCategory(storeId: number, categoryId: number) {
    const category = await this.prisma.withTenant(storeId, () =>
      this.prisma.category.findUnique({
        where: { id: categoryId },
        include: {
          children: {
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          },
        },
      }),
    );

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async createCategory(
    storeId: number,
    data: {
      name: string;
      slug?: string;
      parentId?: number;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    const slug = data.slug || slugify(data.name);

    // Compute path and depth based on parent
    let path = '/';
    let depth = 0;

    if (data.parentId) {
      const parent = await this.prisma.withTenant(storeId, () =>
        this.prisma.category.findUnique({ where: { id: data.parentId } }),
      );
      if (!parent) {
        return { error: 'NOT_FOUND', message: 'Parent category not found' };
      }
      // We'll compute the actual path after creation since we need the new ID
    }

    const category = await this.prisma.withTenant(storeId, async () => {
      const created = await this.prisma.category.create({
        data: {
          name: data.name,
          slug,
          parentId: data.parentId || null,
          sortOrder: data.sortOrder || 0,
          isActive: data.isActive !== false,
        },
      });

      // Update path with the new ID
      if (data.parentId) {
        const parent = await this.prisma.category.findUnique({
          where: { id: data.parentId },
        });
        if (parent) {
          path = `${parent.path}${created.id}/`;
          depth = parent.depth + 1;
        }
      } else {
        path = `/${created.id}/`;
        depth = 0;
      }

      return this.prisma.category.update({
        where: { id: created.id },
        data: { path, depth },
      });
    });

    return category;
  }

  async updateCategory(
    storeId: number,
    categoryId: number,
    data: {
      name?: string;
      slug?: string;
      parentId?: number | null;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    const existing = await this.prisma.withTenant(storeId, () =>
      this.prisma.category.findUnique({ where: { id: categoryId } }),
    );

    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    const updateData: any = { ...data };

    // If parent is changing, need to rebuild path
    if (data.parentId !== undefined && data.parentId !== existing.parentId) {
      if (data.parentId === null) {
        updateData.path = `/${categoryId}/`;
        updateData.depth = 0;
      } else {
        const newParent = await this.prisma.withTenant(storeId, () =>
          this.prisma.category.findUnique({ where: { id: data.parentId! } }),
        );
        if (!newParent) {
          throw new NotFoundException('Parent category not found');
        }
        updateData.path = `${newParent.path}${categoryId}/`;
        updateData.depth = newParent.depth + 1;
      }
    }

    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key],
    );

    return this.prisma.withTenant(storeId, () =>
      this.prisma.category.update({
        where: { id: categoryId },
        data: updateData,
      }),
    );
  }

  async deleteCategory(storeId: number, categoryId: number) {
    const category = await this.prisma.withTenant(storeId, () =>
      this.prisma.category.findUnique({
        where: { id: categoryId },
        include: {
          children: true,
          products: true,
        },
      }),
    );

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.children.length > 0) {
      throw new BadRequestException(
        'Cannot delete category with subcategories. Delete subcategories first.',
      );
    }

    if (category.products.length > 0) {
      throw new BadRequestException(
        'Cannot delete category with products. Remove products first.',
      );
    }

    await this.prisma.withTenant(storeId, () =>
      this.prisma.category.delete({ where: { id: categoryId } }),
    );

    return { message: 'Category deleted' };
  }
}
