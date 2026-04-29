import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(private prisma: PrismaService) {}

  private async enrichItems(storeId: number, items: any[]) {
    if (!items.length) return items;

    const variantIds = [...new Set(items.map((i: any) => i.variantId))];
    const variants = await this.prisma.withTenant(storeId, () =>
      this.prisma.productVariant.findMany({
        where: { id: { in: variantIds } },
        include: { product: { select: { title: true } } },
      }),
    );

    const variantMap = new Map(variants.map((v) => [v.id, v]));

    return items.map((item) => ({
      ...item,
      variant: variantMap.get(item.variantId) || null,
    }));
  }

  async getCart(storeId: number, customerId: number) {
    let cart = await this.prisma.withTenant(storeId, () =>
      this.prisma.cart.findFirst({
        where: { customerId, status: 'active' },
        include: { items: true },
      }),
    );

    if (!cart) {
      cart = await this.prisma.withTenant(storeId, () =>
        this.prisma.cart.create({
          data: { customerId, status: 'active' },
          include: { items: true },
        }),
      );
    }

    return {
      ...cart,
      items: await this.enrichItems(storeId, cart.items),
    };
  }

  async addItem(storeId: number, customerId: number, variantId: number, quantity: number) {
    let cart = await this.prisma.withTenant(storeId, () =>
      this.prisma.cart.findFirst({
        where: { customerId, status: 'active' },
      }),
    );

    if (!cart) {
      cart = await this.prisma.withTenant(storeId, () =>
        this.prisma.cart.create({
          data: { customerId, status: 'active' },
        }),
      );
    }

    const existingItem = await this.prisma.withTenant(storeId, () =>
      this.prisma.cartItem.findFirst({
        where: { cartId: cart.id, variantId },
      }),
    );

    let item;
    if (existingItem) {
      item = await this.prisma.withTenant(storeId, () =>
        this.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + quantity },
        }),
      );
    } else {
      item = await this.prisma.withTenant(storeId, () =>
        this.prisma.cartItem.create({
          data: { cartId: cart.id, variantId, quantity },
        }),
      );
    }

    const enriched = await this.enrichItems(storeId, [item]);
    return enriched[0];
  }

  async updateItemQuantity(storeId: number, customerId: number, itemId: number, quantity: number) {
    const item = await this.prisma.withTenant(storeId, () =>
      this.prisma.cartItem.findFirst({
        where: {
          id: itemId,
          cart: { customerId, status: 'active' },
        },
      }),
    );

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    const updated = await this.prisma.withTenant(storeId, () =>
      this.prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity },
      }),
    );

    const enriched = await this.enrichItems(storeId, [updated]);
    return enriched[0];
  }

  async removeItem(storeId: number, customerId: number, itemId: number) {
    const item = await this.prisma.withTenant(storeId, () =>
      this.prisma.cartItem.findFirst({
        where: {
          id: itemId,
          cart: { customerId, status: 'active' },
        },
      }),
    );

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.withTenant(storeId, () =>
      this.prisma.cartItem.delete({ where: { id: itemId } }),
    );

    return { message: 'Item removed' };
  }

  async clearCart(storeId: number, customerId: number) {
    const cart = await this.prisma.withTenant(storeId, () =>
      this.prisma.cart.findFirst({
        where: { customerId, status: 'active' },
      }),
    );

    if (!cart) {
      throw new NotFoundException('Active cart not found');
    }

    await this.prisma.withTenant(storeId, () =>
      this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } }),
    );

    return { message: 'Cart cleared' };
  }
}
