import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { DiscountsService } from '../discounts/discounts.service';
import { QueueService } from '../../common/queue/queue.service';

export interface CheckoutInput {
  customerId: number;
  cartId: number;
  shippingAddressId: number;
  shippingMethod: 'choco' | 'kazpost' | 'self_pickup';
  promoCodes?: string[];
  paymentProvider: 'kaspi_pay' | 'halyk_bank' | 'manual';
  idempotencyKey: string;
}

const SHIPPING_COSTS: Record<string, number> = {
  choco: 2000,
  kazpost: 1500,
  self_pickup: 0,
};

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    private prisma: PrismaService,
    private paymentsService: PaymentsService,
    private discountsService: DiscountsService,
    private queueService: QueueService,
  ) {}

  async processCheckout(storeId: number, input: CheckoutInput) {
    // Pre-flight validation (outside transaction)
    const customer = await this.prisma.withTenant(storeId, (client) =>
      client.customer.findUnique({ where: { id: input.customerId } }),
    );
    if (!customer) {
      throw new Error('Customer not found');
    }

    const cart = await this.prisma.withTenant(storeId, (client) =>
      client.cart.findFirst({
        where: { id: input.cartId, customerId: input.customerId, status: 'active' },
        include: { items: true },
      }),
    );
    if (!cart || cart.items.length === 0) {
      throw new Error('Cart is empty or not found');
    }

    // Validate all variants
    const variantIds = cart.items.map((item) => item.variantId);
    const variants = await this.prisma.withTenant(storeId, (client) =>
      client.productVariant.findMany({
        where: { id: { in: variantIds }, isActive: true },
      }),
    );
    const variantMap = new Map(variants.map((v) => [v.id, v]));
    for (const item of cart.items) {
      if (!variantMap.has(item.variantId)) {
        throw new Error(`Variant ${item.variantId} not found or inactive`);
      }
    }

    // Validate and apply promo codes
    const promoCodes = input.promoCodes || [];
    const validatedPromos: {
      promoCodeId: number;
      code: string;
      type: string;
      discountTiyin: number;
      isStackable: boolean;
    }[] = [];

    for (const code of promoCodes) {
      const result = await this.discountsService.validatePromoCode(storeId, {
        code,
        cartSubtotalTiyin: 0, // Will recalculate after applying all promos
        customerId: input.customerId,
      });
      validatedPromos.push(result);
    }

    // Stacking rules: max 3 stackable, only 1 exclusive
    const exclusive = validatedPromos.filter((p) => !p.isStackable);
    const stackable = validatedPromos.filter((p) => p.isStackable);

    if (exclusive.length > 1) {
      throw new Error('Cannot combine more than 1 exclusive promo code');
    }
    if (stackable.length > 3) {
      throw new Error('Maximum 3 stackable promo codes allowed');
    }

    // Calculate subtotal
    let subtotalTiyin = 0;
    for (const item of cart.items) {
      const variant = variantMap.get(item.variantId)!;
      subtotalTiyin += item.quantity * variant.priceTiyin;
    }

    // Calculate discounts
    let discountTiyin = 0;
    const appliedPromos: typeof validatedPromos = [];
    for (const promo of [...exclusive, ...stackable]) {
      let promoDiscount = 0;
      if (promo.type === 'percentage') {
        promoDiscount = Math.floor(subtotalTiyin * (promo.discountTiyin / 100));
      } else if (promo.type === 'fixed_amount') {
        promoDiscount = promo.discountTiyin;
      }
      // Recalculate percentage based on remaining subtotal
      if (promo.type === 'percentage') {
        promoDiscount = Math.floor((subtotalTiyin - discountTiyin) * (promo.discountTiyin / 100));
      }
      discountTiyin += promoDiscount;
      appliedPromos.push({ ...promo, discountTiyin: promoDiscount });
    }

    // Calculate shipping
    let shippingTiyin = SHIPPING_COSTS[input.shippingMethod] ?? 0;
    const hasFreeShipping = appliedPromos.some((p) => p.type === 'free_shipping');
    if (hasFreeShipping) {
      shippingTiyin = 0;
    }

    // Calculate VAT (12% of subtotal - discount)
    const vatTiyin = Math.floor((subtotalTiyin - discountTiyin) * 0.12);

    // Calculate total
    const totalTiyin = subtotalTiyin - discountTiyin + shippingTiyin + vatTiyin;

    // ACID transaction: steps 9-14
    const order = await this.prisma.withTenant(storeId, async (client) => {
      return client.$transaction(async (tx) => {
        // Generate order number
        const count = await tx.order.count();
        const orderNumber = `ORD-${String(count + 1).padStart(8, '0')}`;

        // Get shipping address
        const address = await tx.address.findUnique({
          where: { id: input.shippingAddressId },
        });

        // Create order
        const newOrder = await tx.order.create({
          data: {
            orderNumber,
            customerId: input.customerId,
            status: 'payment_pending',
            subtotalTiyin,
            discountTiyin,
            shippingTiyin,
            vatTiyin,
            totalTiyin,
            shippingMethod: input.shippingMethod,
            shippingAddress: address ? {
              fullName: address.fullName,
              phone: address.phone,
              addressLine1: address.addressLine1,
              addressLine2: address.addressLine2 ?? '',
              city: address.city,
              region: address.region ?? '',
              postalCode: address.postalCode ?? '',
            } : undefined,
            idempotencyKey: input.idempotencyKey,
          },
        });

        // Create order items
        const orderItems: Array<{
          productTitle: string;
          variantSku: string;
          quantity: number;
          unitPriceTiyin: number;
        }> = [];

        for (const item of cart.items) {
          const variant = variantMap.get(item.variantId)!;
          // Get product title
          const product = await tx.product.findUnique({
            where: { id: variant.productId },
          });

          const orderItem = {
            productTitle: product?.title || 'Unknown',
            variantSku: variant.sku,
            quantity: item.quantity,
            unitPriceTiyin: variant.priceTiyin,
          };
          orderItems.push(orderItem);

          await tx.orderItem.create({
            data: {
              orderId: newOrder.id,
              variantId: item.variantId,
              productTitle: orderItem.productTitle,
              variantSku: orderItem.variantSku,
              quantity: item.quantity,
              unitPriceTiyin: variant.priceTiyin,
              totalPriceTiyin: item.quantity * variant.priceTiyin,
            },
          });
        }

        // Create order discounts
        for (const promo of appliedPromos) {
          await tx.orderDiscount.create({
            data: {
              orderId: newOrder.id,
              promoCodeId: promo.promoCodeId,
              discountTiyin: promo.discountTiyin,
              description: `Promo code: ${promo.code} (${promo.type})`,
            },
          });

          // Increment promo code used_count
          await tx.promoCode.update({
            where: { id: promo.promoCodeId },
            data: { usedCount: { increment: 1 } },
          });
        }

        // Reserve inventory
        for (const item of cart.items) {
          const inventories = await tx.inventory.findMany({
            where: { variantId: item.variantId },
          });

          let remaining = item.quantity;
          for (const inv of inventories) {
            const available = inv.quantityAvailable - inv.quantityReserved;
            if (available <= 0) continue;

            const toReserve = Math.min(available, remaining);
            await tx.inventory.update({
              where: { id: inv.id },
              data: {
                quantityReserved: { increment: toReserve },
              },
            });
            remaining -= toReserve;
            if (remaining <= 0) break;
          }

          if (remaining > 0) {
            throw new Error(
              `Insufficient inventory for variant ${item.variantId}`,
            );
          }
        }

        // Mark cart as converted
        await tx.cart.update({
          where: { id: input.cartId },
          data: { status: 'converted' },
        });

        return { order: newOrder, orderItems };
      });
    });

    // Step 15: Initiate payment (outside transaction)
    const payment = await this.paymentsService.initiatePayment(storeId, {
      orderId: order.order.id,
      provider: input.paymentProvider,
      idempotencyKey: input.idempotencyKey,
    });

    // Enqueue order confirmation email
    try {
      await this.queueService.enqueueEmail({
        type: 'order-confirmation',
        to: customer.email,
        data: {
          orderNumber: order.order.orderNumber,
          items: order.orderItems.map((item) => ({
            title: item.productTitle,
            sku: item.variantSku,
            quantity: item.quantity,
            price: item.unitPriceTiyin,
          })),
          total: totalTiyin,
          currency: 'KZT',
        },
      });
    } catch {
      // Non-blocking — email queue may not be available
    }

    return {
      order: order.order,
      payment,
    };
  }
}
