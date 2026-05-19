import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DiscountsService {
  private readonly logger = new Logger(DiscountsService.name);

  constructor(private prisma: PrismaService) {}

  async createPromoCode(
    storeId: number,
    data: {
      code: string;
      type: 'percentage' | 'fixed_amount' | 'free_shipping';
      value: number;
      minOrderTiyin?: number;
      maxUses?: number;
      maxPerCustomer?: number;
      isStackable?: boolean;
      firstBuyerOnly?: boolean;
      startsAt?: string;
      expiresAt?: string;
    },
  ) {
    if (data.type === 'percentage' && (data.value < 1 || data.value > 90)) {
      throw new BadRequestException('Percentage value must be between 1 and 90');
    }

    const existing = await this.prisma.withTenant(storeId, (client) =>
      client.promoCode.findUnique({ where: { code: data.code.toUpperCase() } }),
    );

    if (existing) {
      throw new BadRequestException('Promo code already exists');
    }

    return this.prisma.withTenant(storeId, (client) =>
      client.promoCode.create({
        data: {
          code: data.code.toUpperCase(),
          type: data.type,
          value: data.value,
          minOrderTiyin: data.minOrderTiyin ?? 0,
          maxUses: data.maxUses,
          maxPerCustomer: data.maxPerCustomer ?? 1,
          isStackable: data.isStackable ?? false,
          firstBuyerOnly: data.firstBuyerOnly ?? false,
          startsAt: data.startsAt ? new Date(data.startsAt) : null,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        },
      }),
    );
  }

  async listPromoCodes(
    storeId: number,
    params: {
      cursor?: string;
      limit: number;
    },
  ) {
    const items = await this.prisma.withTenant(storeId, (client) =>
      client.promoCode.findMany({
        take: params.limit + 1,
        cursor: params.cursor ? { id: parseInt(params.cursor) } : undefined,
        orderBy: { createdAt: 'desc' },
      }),
    );

    return {
      data: items.slice(0, params.limit),
      meta: {
        limit: params.limit,
        hasMore: items.length > params.limit,
        cursor: items.length > params.limit ? String(items[items.length - 1].id) : undefined,
      },
    };
  }

  async getPromoCode(storeId: number, id: number) {
    const promo = await this.prisma.withTenant(storeId, (client) =>
      client.promoCode.findUnique({ where: { id } }),
    );

    if (!promo) {
      throw new NotFoundException('Promo code not found');
    }

    return promo;
  }

  async updatePromoCode(storeId: number, id: number, data: Record<string, unknown>) {
    const existing = await this.prisma.withTenant(storeId, (client) =>
      client.promoCode.findUnique({ where: { id } }),
    );

    if (!existing) {
      throw new NotFoundException('Promo code not found');
    }

    if (data.type === 'percentage' && data.value !== undefined) {
      const val = data.value as number;
      if (val < 1 || val > 90) {
        throw new BadRequestException('Percentage value must be between 1 and 90');
      }
    }

    const updateData: any = { ...data };
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key],
    );

    if (updateData.startsAt) updateData.startsAt = new Date(updateData.startsAt as string);
    if (updateData.expiresAt) updateData.expiresAt = new Date(updateData.expiresAt as string);

    return this.prisma.withTenant(storeId, (client) =>
      client.promoCode.update({
        where: { id },
        data: updateData,
      }),
    );
  }

  async deletePromoCode(storeId: number, id: number) {
    const existing = await this.prisma.withTenant(storeId, (client) =>
      client.promoCode.findUnique({ where: { id } }),
    );

    if (!existing) {
      throw new NotFoundException('Promo code not found');
    }

    return this.prisma.withTenant(storeId, (client) =>
      client.promoCode.update({
        where: { id },
        data: { isActive: false },
      }),
    );
  }

  async validatePromoCode(
    storeId: number,
    data: {
      code: string;
      cartSubtotalTiyin: number;
      customerId?: number;
    },
  ) {
    const promo = await this.prisma.withTenant(storeId, (client) =>
      client.promoCode.findUnique({
        where: { code: data.code.toUpperCase() },
      }),
    );

    if (!promo || !promo.isActive) {
      throw new BadRequestException('Promo code is invalid or inactive');
    }

    const now = new Date();

    // Check date range
    if (promo.startsAt && promo.startsAt > now) {
      throw new BadRequestException('Promo code is not yet active');
    }

    if (promo.expiresAt && promo.expiresAt < now) {
      throw new BadRequestException('Promo code has expired');
    }

    // Check usage limit
    if (promo.maxUses && promo.usedCount >= promo.maxUses) {
      throw new BadRequestException('Promo code usage limit reached');
    }

    // Check min order
    if (data.cartSubtotalTiyin < promo.minOrderTiyin) {
      throw new BadRequestException(`Minimum order amount is ${promo.minOrderTiyin} tiyin`);
    }

    // Check first buyer
    if (promo.firstBuyerOnly && data.customerId) {
      const orderCount = await this.prisma.withTenant(storeId, (client) =>
        client.order.count({
          where: { customerId: data.customerId },
        }),
      );
      if (orderCount > 0) {
        throw new BadRequestException('Promo code is for first-time buyers only');
      }
    }

    // Check max per customer
    if (data.customerId) {
      const customerUsage = await this.prisma.withTenant(storeId, (client) =>
        client.orderDiscount.count({
          where: {
            promoCodeId: promo.id,
            order: { customerId: data.customerId },
          },
        }),
      );
      if (customerUsage >= promo.maxPerCustomer) {
        throw new BadRequestException(
          `You have already used this promo code ${promo.maxPerCustomer} time(s)`,
        );
      }
    }

    // Calculate discount amount
    let discountTiyin = 0;
    if (promo.type === 'percentage') {
      discountTiyin = Math.floor(data.cartSubtotalTiyin * (promo.value / 100));
    } else if (promo.type === 'fixed_amount') {
      discountTiyin = promo.value;
    }
    // free_shipping: discountTiyin stays 0, handled at shipping level

    return {
      valid: true,
      promoCodeId: promo.id,
      code: promo.code,
      type: promo.type,
      discountTiyin,
      isStackable: promo.isStackable,
    };
  }

  /**
   * Apply multiple promo codes to a cart subtotal.
   * Handles stacked vs exclusive rules and VAT calculation.
   * - Exclusive promos: only the highest-value exclusive promo is applied
   * - Stackable promos: all are applied sequentially
   * - VAT (12% Kazakhstan) is calculated AFTER discounts
   */
  async applyDiscounts(
    storeId: number,
    data: {
      codes: string[];
      subtotalTiyin: number;
      customerId?: number;
      shippingTiyin?: number;
    },
  ) {
    const VAT_RATE = 0.12; // 12% Kazakhstan VAT
    let remainingSubtotal = data.subtotalTiyin;
    const applied: Array<{
      code: string;
      type: string;
      discountTiyin: number;
    }> = [];

    // Separate into exclusive and stackable
    const exclusiveDiscounts: Array<{
      code: string;
      type: string;
      discountTiyin: number;
    }> = [];
    const stackableDiscounts: Array<{
      code: string;
      type: string;
      discountTiyin: number;
    }> = [];

    for (const code of data.codes) {
      try {
        const result = await this.validatePromoCode(storeId, {
          code,
          cartSubtotalTiyin: remainingSubtotal,
          customerId: data.customerId,
        });

        if (result.isStackable) {
          stackableDiscounts.push({
            code: result.code,
            type: result.type,
            discountTiyin: result.discountTiyin,
          });
        } else {
          exclusiveDiscounts.push({
            code: result.code,
            type: result.type,
            discountTiyin: result.discountTiyin,
          });
        }
      } catch {
        // Skip invalid codes silently
      }
    }

    // Apply exclusive: pick highest value one only
    if (exclusiveDiscounts.length > 0) {
      exclusiveDiscounts.sort((a, b) => b.discountTiyin - a.discountTiyin);
      const best = exclusiveDiscounts[0];
      const actualDiscount = Math.min(best.discountTiyin, remainingSubtotal);
      remainingSubtotal -= actualDiscount;
      applied.push({ ...best, discountTiyin: actualDiscount });
    }

    // Apply stackable: apply each sequentially
    for (const disc of stackableDiscounts) {
      let discountAmount = disc.discountTiyin;
      // For percentage, recalculate on remaining subtotal
      if (disc.type === 'percentage') {
        const promo = await this.prisma.withTenant(storeId, (client) =>
          client.promoCode.findUnique({ where: { code: disc.code } }),
        );
        if (promo) {
          discountAmount = Math.floor(remainingSubtotal * (promo.value / 100));
        }
      }
      const actualDiscount = Math.min(discountAmount, remainingSubtotal);
      remainingSubtotal -= actualDiscount;
      applied.push({ ...disc, discountTiyin: actualDiscount });
    }

    const totalDiscount = data.subtotalTiyin - remainingSubtotal;
    const discountedSubtotal = remainingSubtotal;

    // VAT calculation: VAT is on the discounted subtotal
    const vatTiyin = Math.floor(discountedSubtotal * VAT_RATE);
    const grandTotal = discountedSubtotal + (data.shippingTiyin || 0) + vatTiyin;

    return {
      originalSubtotal: data.subtotalTiyin,
      totalDiscount,
      discountedSubtotal,
      shippingTiyin: data.shippingTiyin || 0,
      vatRate: VAT_RATE,
      vatTiyin,
      grandTotal,
      appliedPromos: applied,
      skippedExclusive: exclusiveDiscounts.length > 1
        ? exclusiveDiscounts.slice(1).map((d) => d.code)
        : [],
    };
  }
}
