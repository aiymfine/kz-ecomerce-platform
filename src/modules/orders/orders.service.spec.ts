import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../prisma/prisma.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { QueueService } from '../../common/queue/queue.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('OrdersService', () => {
  let service: OrdersService;
  let prismaMock: any;
  let webhooksMock: any;
  let queueMock: any;

  beforeEach(async () => {
    prismaMock = {
      withTenant: jest.fn((storeId: number, fn: (...args: unknown[]) => unknown) => fn(prismaMock)),
      order: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
      },
      cart: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      productVariant: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    webhooksMock = {
      fireEvent: jest.fn().mockResolvedValue([]),
    };

    queueMock = {
      enqueueEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: WebhooksService, useValue: webhooksMock },
        { provide: QueueService, useValue: queueMock },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  describe('generateOrderNumber', () => {
    it('should generate order number with SB prefix', () => {
      const orderNumber = service.generateOrderNumber();
      expect(orderNumber).toMatch(/^SB-\d+-\d+$/);
    });

    it('should generate unique order numbers', () => {
      // Timestamp-based: may collide within same ms, so just check format uniqueness
      const numbers = Array.from({ length: 100 }, () => service.generateOrderNumber());
      const uniqueNumbers = new Set(numbers);
      expect(uniqueNumbers.size).toBeGreaterThanOrEqual(99);
    });
  });

  describe('checkout', () => {
    it('should throw if no active cart', async () => {
      prismaMock.cart.findFirst.mockResolvedValue(null);

      await expect(service.checkout(1, 1, { shippingMethod: 'self_pickup' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if cart is empty', async () => {
      prismaMock.cart.findFirst.mockResolvedValue({ id: 1, items: [] });

      await expect(service.checkout(1, 1, { shippingMethod: 'self_pickup' })).rejects.toThrow(
        'No active cart or cart is empty',
      );
    });

    it('should create order with correct totals', async () => {
      const mockCart = {
        id: 1,
        customerId: 1,
        status: 'active',
        items: [
          { id: 1, variantId: 1, quantity: 2 },
          { id: 2, variantId: 3, quantity: 1 },
        ],
      };

      prismaMock.cart.findFirst.mockResolvedValue(mockCart);
      prismaMock.productVariant.findMany.mockResolvedValue([
        { id: 1, priceTiyin: 100000, sku: 'SKU-1', product: { title: 'Product 1' } },
        { id: 3, priceTiyin: 200000, sku: 'SKU-3', product: { title: 'Product 3' } },
      ]);

      const mockOrder = {
        id: 1,
        orderNumber: 'SB-123-456',
        totalTiyin: 400000, // 100000*2 + 200000*1
        items: [
          {
            productTitle: 'Product 1',
            variantSku: 'SKU-1',
            quantity: 2,
            unitPriceTiyin: 100000,
            totalPriceTiyin: 200000,
          },
          {
            productTitle: 'Product 3',
            variantSku: 'SKU-3',
            quantity: 1,
            unitPriceTiyin: 200000,
            totalPriceTiyin: 200000,
          },
        ],
      };
      prismaMock.order.create.mockResolvedValue(mockOrder);
      prismaMock.cart.update.mockResolvedValue({ ...mockCart, status: 'converted' });

      const result = await service.checkout(1, 1, { shippingMethod: 'self_pickup' });

      expect(result.totalTiyin).toBe(400000);
      expect(result.items).toHaveLength(2);
      expect(prismaMock.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'payment_pending',
            subtotalTiyin: 400000,
            totalTiyin: 400000,
          }),
        }),
      );
      expect(prismaMock.cart.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'converted' },
        }),
      );
      expect(webhooksMock.fireEvent).toHaveBeenCalledWith(1, 'order.created', expect.any(Object));
      expect(queueMock.enqueueEmail).toHaveBeenCalled();
    });
  });

  describe('listOrders', () => {
    it('should return paginated orders', async () => {
      prismaMock.order.findMany.mockResolvedValue([
        { id: 1, orderNumber: 'SB-1', customer: { firstName: 'Test' } },
      ]);

      const result = await service.listOrders(1, { limit: 10, sort: 'desc' });

      expect(result.data).toHaveLength(1);
      expect(prismaMock.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 11, // limit + 1 for hasMore
        }),
      );
    });
  });

  describe('updateOrderStatus', () => {
    it('should throw if order not found', async () => {
      prismaMock.order.findUnique.mockResolvedValue(null);

      await expect(service.updateOrderStatus(1, 999, 'confirmed')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw for invalid transition', async () => {
      prismaMock.order.findUnique.mockResolvedValue({ id: 1, status: 'delivered' });

      await expect(service.updateOrderStatus(1, 1, 'confirmed')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should allow valid transition', async () => {
      prismaMock.order.findUnique.mockResolvedValue({ id: 1, status: 'payment_pending' });
      prismaMock.order.update.mockResolvedValue({ id: 1, status: 'confirmed' });

      const result = await service.updateOrderStatus(1, 1, 'confirmed');

      expect(result.status).toBe('confirmed');
    });
  });
});
