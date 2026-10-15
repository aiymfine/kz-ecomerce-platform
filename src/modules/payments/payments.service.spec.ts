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
      withTenant: jest.fn((storeId: number, fn: (...args: unknown[]) => unknown) => fn(prismaMock)),
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
      prismaMock.order.findUnique.mockResolvedValue({
        id: 1,
        status: 'delivered',
        totalTiyin: 10000,
      });

      await expect(
        service.initiatePayment(1, {
          orderId: 1,
          provider: 'kaspi_pay',
          idempotencyKey: 'key-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return existing payment for same idempotency key', async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        id: 1,
        status: 'payment_pending',
        totalTiyin: 10000,
      });
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
      prismaMock.order.findUnique.mockResolvedValue({
        id: 1,
        status: 'payment_pending',
        totalTiyin: 50000,
      });
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

    it('should return a 3-D Secure challenge for gateway providers', async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        id: 1,
        status: 'payment_pending',
        totalTiyin: 50000,
      });
      prismaMock.payment.findUnique.mockResolvedValue(null);
      prismaMock.payment.create.mockResolvedValue({
        id: 1,
        status: 'pending',
        amountTiyin: 50000,
        metadata: null,
      });
      prismaMock.payment.update.mockImplementation(({ data }: any) =>
        Promise.resolve({
          id: 1,
          status: data.status,
          amountTiyin: 50000,
          metadata: data.metadata,
        }),
      );

      const result = (await service.initiatePayment(1, {
        orderId: 1,
        provider: 'kaspi_pay',
        idempotencyKey: 'key-kaspi',
      })) as any;

      expect(prismaMock.payment.create).toHaveBeenCalled();
      expect(result.requires_3ds).toBe(true);
      expect(result.three_ds_redirect_url).toContain('/3ds/challenge?token=');
      expect(result.metadata.requires3ds).toBe(true);
      expect(result.metadata.threeDsStatus).toBe('challenge_required');
    });
  });

  describe('completeThreeDs', () => {
    const paymentWithChallenge = {
      id: 1,
      orderId: 10,
      amountTiyin: 50000,
      provider: 'kaspi_pay',
      status: 'processing',
      metadata: {
        requires3ds: true,
        threeDsStatus: 'challenge_required',
        threeDsToken: 'a'.repeat(32),
      },
    };

    it('should throw if payment not found', async () => {
      prismaMock.payment.findUnique.mockResolvedValue(null);

      await expect(
        service.completeThreeDs(1, 999, { threeDsToken: 'a'.repeat(32), result: 'authenticated' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if payment does not require 3-D Secure', async () => {
      prismaMock.payment.findUnique.mockResolvedValue({
        id: 1,
        status: 'pending',
        metadata: null,
      });

      await expect(
        service.completeThreeDs(1, 1, { threeDsToken: 'a'.repeat(32), result: 'authenticated' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if 3-D Secure was already completed', async () => {
      prismaMock.payment.findUnique.mockResolvedValue({
        ...paymentWithChallenge,
        status: 'succeeded',
        metadata: { ...paymentWithChallenge.metadata, threeDsStatus: 'authenticated' },
      });

      await expect(
        service.completeThreeDs(1, 1, { threeDsToken: 'a'.repeat(32), result: 'authenticated' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw for an invalid 3-D Secure token', async () => {
      prismaMock.payment.findUnique.mockResolvedValue(paymentWithChallenge);

      await expect(
        service.completeThreeDs(1, 1, { threeDsToken: 'b'.repeat(32), result: 'authenticated' }),
      ).rejects.toThrow('Invalid 3-D Secure token');
    });

    it('should succeed: payment succeeded, order confirmed, receipt email queued', async () => {
      prismaMock.payment.findUnique.mockResolvedValueOnce(paymentWithChallenge);
      prismaMock.payment.update.mockResolvedValue({
        id: 1,
        status: 'succeeded',
        providerTxId: '3ds-abc',
      });
      prismaMock.order.findUnique.mockResolvedValue({ id: 10, orderNumber: 'SB-1' });
      prismaMock.order.update.mockResolvedValue({ id: 10, status: 'confirmed' });

      const result = await service.completeThreeDs(1, 1, {
        threeDsToken: 'a'.repeat(32),
        result: 'authenticated',
      });

      expect(result.status).toBe('succeeded');
      expect(prismaMock.order.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'confirmed' } }),
      );
      expect(queueMock.enqueueEmail).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'payment-receipt' }),
      );
    });

    it('should fail: payment failed, order set to payment_failed', async () => {
      prismaMock.payment.findUnique.mockResolvedValueOnce(paymentWithChallenge);
      prismaMock.payment.update.mockResolvedValue({ id: 1, status: 'failed' });
      prismaMock.order.update.mockResolvedValue({ id: 10, status: 'payment_failed' });

      const result = await service.completeThreeDs(1, 1, {
        threeDsToken: 'a'.repeat(32),
        result: 'failed',
      });

      expect(result.status).toBe('failed');
      expect(prismaMock.order.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'payment_failed' } }),
      );
      expect(queueMock.enqueueEmail).not.toHaveBeenCalled();
    });
  });

  describe('refund', () => {
    it('should throw if payment not found', async () => {
      prismaMock.payment.findUnique.mockResolvedValue(null);

      await expect(service.refund(1, 999, { amountTiyin: 5000 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw if payment not succeeded', async () => {
      prismaMock.payment.findUnique.mockResolvedValue({
        id: 1,
        status: 'pending',
        amountTiyin: 10000,
      });

      await expect(service.refund(1, 1, { amountTiyin: 5000 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if refund exceeds payment amount', async () => {
      prismaMock.payment.findUnique.mockResolvedValue({
        id: 1,
        status: 'succeeded',
        amountTiyin: 10000,
      });

      await expect(service.refund(1, 1, { amountTiyin: 20000 })).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
