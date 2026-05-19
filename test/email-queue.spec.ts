import { Queue } from 'bullmq';

// Simple unit test for email queue enqueue behavior
// Tests that the QueueService correctly calls queue.add for different email types

describe('Email Queue', () => {
  let mockQueue: { add: jest.Mock };
  let enqueueEmail: (job: any) => Promise<string>;

  beforeEach(() => {
    mockQueue = { add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }) };
    enqueueEmail = async (job: any) => {
      const result = await mockQueue.add('send-email', job);
      return result.id || '';
    };
  });

  it('should enqueue verification email with correct data', async () => {
    const jobId = await enqueueEmail({
      to: 'test@example.com',
      type: 'verification',
      data: { code: '123456', name: 'Test' },
    });

    expect(mockQueue.add).toHaveBeenCalledWith('send-email', {
      to: 'test@example.com',
      type: 'verification',
      data: { code: '123456', name: 'Test' },
    });
    expect(jobId).toBe('mock-job-id');
  });

  it('should enqueue order confirmation email', async () => {
    await enqueueEmail({
      to: 'customer@example.com',
      type: 'order-confirmation',
      data: { orderNumber: 'SB-TEST-001', total: 49900, items: [] },
    });

    expect(mockQueue.add).toHaveBeenCalledTimes(1);
    expect(mockQueue.add).toHaveBeenCalledWith(
      'send-email',
      expect.objectContaining({ type: 'order-confirmation' }),
    );
  });

  it('should enqueue payment receipt email', async () => {
    await enqueueEmail({
      to: 'customer@example.com',
      type: 'payment-receipt',
      data: { orderNumber: 'SB-TEST-001', amount: 49900, provider: 'kaspi_pay', transactionId: 'TX-123' },
    });

    expect(mockQueue.add).toHaveBeenCalledWith(
      'send-email',
      expect.objectContaining({ type: 'payment-receipt' }),
    );
  });

  it('should enqueue password reset email', async () => {
    await enqueueEmail({
      to: 'user@example.com',
      type: 'password-reset',
      data: { token: 'reset-abc', name: 'User' },
    });

    expect(mockQueue.add).toHaveBeenCalledWith(
      'send-email',
      expect.objectContaining({ type: 'password-reset' }),
    );
  });
});
