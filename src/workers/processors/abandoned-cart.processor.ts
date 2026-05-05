import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const worker = new Worker('abandoned-carts', async (job: Job) => {
  console.log(`[AbandonedCartWorker] Processing job ${job.id}: ${job.name}`);

  const { storeId, cartId, customerId } = job.data;

  // Mark cart as abandoned
  await prisma.cart.update({
    where: { id: cartId },
    data: { status: 'abandoned' },
  });

  console.log(`[AbandonedCartWorker] Cart ${cartId} marked as abandoned`);
}, {
  connection: {
    url: process.env.REDIS_URL || 'redis://localhost:6379/0',
  },
  concurrency: 3,
});

worker.on('completed', (job) => {
  console.log(`[AbandonedCartWorker] Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`[AbandonedCartWorker] Job ${job?.id} failed: ${err.message}`);
});

worker.on('ready', () => {
  console.log('[AbandonedCartWorker] Abandoned cart worker ready');
});

console.log('[AbandonedCartWorker] Starting abandoned cart processor...');
