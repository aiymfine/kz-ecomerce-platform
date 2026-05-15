import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const worker = new Worker(
  'abandoned-carts',
  async (job: Job) => {
    console.log(`[AbandonedCartWorker] Processing job ${job.id}: ${job.name}`);

    if (job.name === 'check-all-stores') {
      // Scan all stores for abandoned carts
      const stores = await prisma.store.findMany({ where: { status: 'active' } });
      let count = 0;
      for (const store of stores) {
        const cutoff = new Date(Date.now() - 30 * 60 * 1000); // 30 min ago
        const carts = await prisma.cart.findMany({
          where: {
            status: 'active',
            updatedAt: { lt: cutoff },
          },
        });
        for (const cart of carts) {
          await prisma.cart.update({
            where: { id: cart.id },
            data: { status: 'abandoned' },
          });
          count++;
        }
      }
      console.log(`[AbandonedCartWorker] Scanned ${stores.length} stores, abandoned ${count} carts`);
    } else {
      // Process individual cart
      const { cartId } = job.data;
      if (!cartId) {
        console.log(`[AbandonedCartWorker] No cartId in job data, skipping`);
        return;
      }
      await prisma.cart.update({
        where: { id: cartId },
        data: { status: 'abandoned' },
      });
      console.log(`[AbandonedCartWorker] Cart ${cartId} marked as abandoned`);
    }
  },
  {
    connection: {
      url: process.env.REDIS_URL || 'redis://localhost:6379/0',
    },
    concurrency: 3,
  },
);

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
