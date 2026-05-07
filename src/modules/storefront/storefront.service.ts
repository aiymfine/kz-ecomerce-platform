import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import type { JwtPayload } from '../../common/guards/jwt-auth.guard';

@Injectable()
export class StorefrontService {
  private readonly logger = new Logger(StorefrontService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  async register(
    storeId: number,
    dto: {
      email: string;
      password: string;
      first_name: string;
      last_name?: string;
      phone?: string;
    },
  ) {
    const existing = await this.prisma.withTenant(storeId, (client) =>
      client.customer.findUnique({
        where: { email: dto.email },
      }),
    );
    if (existing) {
      return { error: 'CONFLICT', message: 'Email already registered' };
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const customer = await this.prisma.withTenant(storeId, (client) =>
      client.customer.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.first_name,
          lastName: dto.last_name,
          phone: dto.phone,
        },
      }),
    );

    const tokens = await this.generateTokens({
      sub: customer.id,
      email: customer.email,
      role: 'customer',
      storeId,
    });

    return {
      customer: this.sanitizeCustomer(customer),
      ...tokens,
    };
  }

  async login(storeId: number, dto: { email: string; password: string }) {
    const customer = await this.prisma.withTenant(storeId, (client) =>
      client.customer.findUnique({
        where: { email: dto.email },
      }),
    );

    if (!customer) {
      return { error: 'UNAUTHORIZED', message: 'Invalid credentials' };
    }

    const isValid = await bcrypt.compare(dto.password, customer.passwordHash);
    if (!isValid) {
      return { error: 'UNAUTHORIZED', message: 'Invalid credentials' };
    }

    // Update last login
    await this.prisma.withTenant(storeId, (client) =>
      client.customer.update({
        where: { id: customer.id },
        data: { lastLoginAt: new Date() },
      }),
    );

    const tokens = await this.generateTokens({
      sub: customer.id,
      email: customer.email,
      role: 'customer',
      storeId,
    });

    return {
      customer: this.sanitizeCustomer(customer),
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken);

      if (payload.jti) {
        const blacklisted = await this.redisService.isTokenBlacklisted(payload.jti);
        if (blacklisted) {
          return { error: 'UNAUTHORIZED', message: 'Token has been revoked' };
        }
      }

      if (!payload.storeId) {
        return { error: 'UNAUTHORIZED', message: 'Invalid token' };
      }

      const customer = await this.prisma.withTenant(payload.storeId, (client) =>
        client.customer.findUnique({
          where: { id: payload.sub },
        }),
      );
      if (!customer) {
        return { error: 'UNAUTHORIZED', message: 'User not found' };
      }

      const tokens = await this.generateTokens({
        sub: customer.id,
        email: customer.email,
        role: 'customer',
        storeId: payload.storeId,
      });

      return {
        customer: this.sanitizeCustomer(customer),
        ...tokens,
      };
    } catch {
      return { error: 'UNAUTHORIZED', message: 'Invalid refresh token' };
    }
  }

  async logout(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken);
      const refreshTokenExpireDays = this.configService.get<number>(
        'JWT_REFRESH_TOKEN_EXPIRE_DAYS',
        7,
      );

      if (payload.jti) {
        await this.redisService.blacklistToken(payload.jti, refreshTokenExpireDays * 24 * 60 * 60);
      }

      return { message: 'Logged out successfully' };
    } catch {
      return { message: 'Logged out successfully' };
    }
  }

  async listProducts(
    storeId: number,
    params: {
      cursor?: string;
      limit: number;
      sort: 'asc' | 'desc';
      search?: string;
      categoryId?: number;
    },
  ) {
    const where: any = { status: 'active' };

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.categoryId) {
      where.categories = { some: { id: params.categoryId } };
    }

    const items = await this.prisma.withTenant(storeId, (client) =>
      client.product.findMany({
        where,
        take: params.limit + 1,
        cursor: params.cursor ? { id: parseInt(params.cursor) } : undefined,
        orderBy: { createdAt: params.sort === 'asc' ? 'asc' : 'desc' },
        include: {
          images: { orderBy: { position: 'asc' }, take: 1 },
          variants: { where: { isActive: true }, take: 1, orderBy: { position: 'asc' } },
        },
      }),
    );

    const hasMore = items.length > params.limit;
    const sliced = hasMore ? items.slice(0, params.limit) : items;

    return {
      data: sliced,
      pagination: {
        hasMore,
        cursor: hasMore ? String(items[items.length - 2].id) : undefined,
        limit: params.limit,
      },
    };
  }

  async getProductBySlug(storeId: number, slug: string) {
    const product = await this.prisma.withTenant(storeId, (client) =>
      client.product.findFirst({
        where: { slug, status: 'active' },
        include: {
          images: { orderBy: { position: 'asc' } },
          variants: {
            where: { isActive: true },
            orderBy: { position: 'asc' },
            include: {
              attributeValues: { include: { attribute: true } },
            },
          },
          categories: {
            include: { category: true },
          },
        },
      }),
    );

    if (!product) {
      return { error: 'NOT_FOUND', message: 'Product not found' };
    }

    return product;
  }

  async listCategories(storeId: number) {
    const categories = await this.prisma.withTenant(storeId, (client) =>
      client.category.findMany({
        where: { isActive: true },
        orderBy: [{ depth: 'asc' }, { sortOrder: 'asc' }],
      }),
    );

    // Build tree
    const map = new Map<number, any>();
    const tree: any[] = [];
    for (const cat of categories) {
      map.set(cat.id, { ...cat, children: [] });
    }
    for (const cat of categories) {
      const node = map.get(cat.id)!;
      if (cat.parentId && map.has(cat.parentId)) {
        map.get(cat.parentId)!.children.push(node);
      } else {
        tree.push(node);
      }
    }

    return tree;
  }

  async getCategoryProducts(
    storeId: number,
    slug: string,
    params: { cursor?: string; limit: number; sort: 'asc' | 'desc' },
  ) {
    const category = await this.prisma.withTenant(storeId, (client) =>
      client.category.findFirst({
        where: { slug, isActive: true },
      }),
    );

    if (!category) {
      return { error: 'NOT_FOUND', message: 'Category not found' };
    }

    // Use materialized path to find products in this category and all subcategories
    const categoryIds = await this.prisma.withTenant(storeId, (client) =>
      client.category.findMany({
        where: {
          path: { startsWith: category.path },
          isActive: true,
        },
        select: { id: true },
      }),
    );

    const ids = categoryIds.map((c) => c.id);

    const items = await this.prisma.withTenant(storeId, (client) =>
      client.product.findMany({
        where: {
          status: 'active',
          categories: { some: { categoryId: { in: ids } } },
        },
        take: params.limit + 1,
        cursor: params.cursor ? { id: parseInt(params.cursor) } : undefined,
        orderBy: { createdAt: params.sort === 'asc' ? 'asc' : 'desc' },
        include: {
          images: { orderBy: { position: 'asc' }, take: 1 },
          variants: { where: { isActive: true }, take: 1, orderBy: { position: 'asc' } },
        },
      }),
    );

    const hasMore = items.length > params.limit;
    const sliced = hasMore ? items.slice(0, params.limit) : items;

    return {
      category,
      data: sliced,
      pagination: {
        hasMore,
        cursor: hasMore ? String(items[items.length - 2].id) : undefined,
        limit: params.limit,
      },
    };
  }

  private async generateTokens(payload: {
    sub: number;
    email: string;
    role: string;
    storeId: number;
  }) {
    const jti = randomUUID();
    const accessTokenExpireMinutes = this.configService.get<number>(
      'JWT_ACCESS_TOKEN_EXPIRE_MINUTES',
      30,
    );
    const refreshTokenExpireDays = this.configService.get<number>(
      'JWT_REFRESH_TOKEN_EXPIRE_DAYS',
      7,
    );

    const accessToken = this.jwtService.sign(
      { ...payload, jti },
      { expiresIn: `${accessTokenExpireMinutes}m` },
    );

    const refreshToken = this.jwtService.sign(
      { ...payload, jti: randomUUID(), type: 'refresh' },
      { expiresIn: `${refreshTokenExpireDays}d` },
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: accessTokenExpireMinutes * 60,
    };
  }

  private sanitizeCustomer(customer: any) {
    const { passwordHash, ...safe } = customer;
    return safe;
  }
}
