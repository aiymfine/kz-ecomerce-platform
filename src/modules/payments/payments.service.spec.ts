import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../../prisma/prisma.service';
import { QueueService } from '../../common/queue/queue.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prismaMock: any;
  let queueMock: any;

  beforeEach(async () => {
    prismaMock = {
      withTenant: jest.fn((storeId: number, fn: Function) => fn(prismaMock)),
      order: {
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
      },
      payment: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    queueMock = {
      enqueueEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: QueueService, useValue: queueMock },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  describe('initiatePayment', () => {
    it('should throw if order not found', async () => {
      prismaMock.order.findUnique.mockResolvedValue(null);

      await expect(
        service.initiatePayment(1, {
          orderId: 999,
          provider: 'kaspi_pay',
          idempotencyKey: 'key-1',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if order status is not payment_pending', async () => {
      prismaMock.order.findUnique.mockResolvedValue({ id: 1, status: 'delivered', totalTiyin: 10000 });

      await expect(
        service.initiatePayment(1, {
          orderId: 1,
          provider: 'kaspi_pay',
          idempotencyKey: 'key-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return existing payment for same idempotency key', async () => {
      prismaMock.order.findUnique.mockResolvedValue({ id: 1, status: 'payment_pending', totalTiyin: 10000 });
      const existingPayment = { id: 1, status: 'pending', amountTiyin: 10000 };
      prismaMock.payment.findUnique.mockResolvedValue(existingPayment);

      const result = await service.initiatePayment(1, {
        orderId: 1,
        provider: 'kaspi_pay',
        idempotencyKey: 'same-key',
      });

      expect(result).toEqual(existingPayment);
      expect(prismaMock.payment.create).not.toHaveBeenCalled();
    });

    it('should create payment and confirm order for manual provider', async () => {
      prismaMock.order.findUnique.mockResolvedValue({ id: 1, status: 'payment_pending', totalTiyin: 50000 });
      prismaMock.payment.findUnique.mockResolvedValue(null);
      const mockPayment = { id: 1, status: 'succeeded', amountTiyin: 50000 };
      prismaMock.payment.create.mockResolvedValue(mockPayment);
      prismaMock.order.update.mockResolvedValue({ id: 1, status: 'confirmed' });

      const result = await service.initiatePayment(1, {
        orderId: 1,
        provider: 'manual',
        idempotencyKey: 'key-manual',
      });

      expect(result.status).toBe('succeeded');
      expect(prismaMock.order.update).toHaveBeenCalled();
    });

    it('should return payment URL for gateway providers', async () => {
      prismaMock.order.findUnique.mockResolvedValue({ id: 1, status: 'payment_pending', totalTiyin: 50000 });
      prismaMock.payment.findUnique.mockResolvedValue(null);
      prismaMock.payment.create.mockResolvedValue({ id: 1, status: 'pending', amountTiyin: 50000 });

      const result = await service.initiatePayment(1, {
        orderId: 1,
        provider: 'kaspi_pay',
        idempotencyKey: 'key-kaspi',
      });

      expect(prismaMock.payment.create).toHaveBeenCalled();
    });
  });

  describe('refund', () => {
    it('should throw if payment not found', async () => {
      prismaMock.payment.findUnique.mockResolvedValue(null);

      await expect(
        service.refund(1, 999, { amountTiyin: 5000 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if payment not succeeded', async () => {
      prismaMock.payment.findUnique.mockResolvedValue({ id: 1, status: 'pending', amountTiyin: 10000 });

      await expect(
        service.refund(1, 1, { amountTiyin: 5000 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if refund exceeds payment amount', async () => {
      prismaMock.payment.findUnique.mockResolvedValue({ id: 1, status: 'succeeded', amountTiyin: 10000 });

      await expect(
        service.refund(1, 1, { amountTiyin: 20000 }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
