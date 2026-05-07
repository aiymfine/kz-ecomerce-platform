import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * Webhook Delivery Processor
 *
 * Processes webhook delivery jobs from BullMQ queue.
 * Signs payloads with HMAC-SHA256, delivers via HTTP POST,
 * tracks attempts, and handles retries with exponential backoff.
 *
 * Job data: { webhookEventId, storeId, webhookId, eventType, payload, url, secret }
 */

const MAX_ATTEMPTS = 5;
const BACKOFF_BASE_MS = 5000; // 5s, 10s, 20s, 40s, 80s

function signPayload(secret: string, payload: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

async function deliverWebhook(job: Job) {
  const { webhookEventId, storeId, webhookId, eventType, payload, url, secret } = job.data;

  console.log(`[WebhookWorker] Delivering ${eventType} to webhook ${webhookId} (event ${webhookEventId})`);

  const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = signPayload(secret, `${timestamp}.${payloadStr}`);

  // Update event status to delivering
  try {
    await prisma.$executeRawUnsafe(
      `SET search_path = store_${storeId}, public; UPDATE webhook_events SET status = 'delivering', attempt_count = attempt_count + 1, last_response_code = NULL WHERE id = ${webhookEventId}; SET search_path = public;`,
    );
  } catch (err) {
    console.error(`[WebhookWorker] Failed to update event ${webhookEventId}:`, err);
  }

  let responseCode: number;
  let responseBody: string;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Timestamp': timestamp,
        'X-Webhook-Event': eventType,
        'X-Webhook-Delivery': webhookEventId.toString(),
      },
      body: payloadStr,
      signal: controller.signal,
    });

    clearTimeout(timeout);
    responseCode = response.status;
    responseBody = await response.text();
  } catch (err: any) {
    responseCode = 0; // Network error
    responseBody = err.message || 'Unknown error';
    console.error(`[WebhookWorker] Delivery failed (network): ${err.message}`);
  }

  const attemptCount = job.attemptsMade;

  if (responseCode >= 200 && responseCode < 300) {
    // Success
    try {
      await prisma.$executeRawUnsafe(
        `SET search_path = store_${storeId}, public; UPDATE webhook_events SET status = 'delivered', delivered_at = NOW(), last_response_code = ${responseCode}, next_retry_at = NULL WHERE id = ${webhookEventId}; SET search_path = public;`,
      );
    } catch (err) {
      console.error(`[WebhookWorker] Failed to mark delivered ${webhookEventId}:`, err);
    }
    console.log(`[WebhookWorker] ✅ Event ${webhookEventId} delivered (${responseCode})`);
  } else if (attemptCount >= MAX_ATTEMPTS) {
    // Max retries exceeded — move to dead letter
    try {
      await prisma.$executeRawUnsafe(
        `SET search_path = store_${storeId}, public; UPDATE webhook_events SET status = 'dead_letter', last_response_code = ${responseCode || 'NULL'}, next_retry_at = NULL WHERE id = ${webhookEventId}; SET search_path = public;`,
      );
    } catch (err) {
      console.error(`[WebhookWorker] Failed to mark dead_letter ${webhookEventId}:`, err);
    }
    console.log(`[WebhookWorker] ☠️ Event ${webhookEventId} moved to dead letter after ${attemptCount} attempts`);
  } else {
    // Retry with exponential backoff
    const backoffMs = BACKOFF_BASE_MS * Math.pow(2, attemptCount - 1);
    const nextRetry = new Date(Date.now() + backoffMs);

    try {
      await prisma.$executeRawUnsafe(
        `SET search_path = store_${storeId}, public; UPDATE webhook_events SET status = 'failed', last_response_code = ${responseCode || 'NULL'}, next_retry_at = '${nextRetry.toISOString()}' WHERE id = ${webhookEventId}; SET search_path = public;`,
      );
    } catch (err) {
      console.error(`[WebhookWorker] Failed to schedule retry ${webhookEventId}:`, err);
    }
    console.log(`[WebhookWorker] ⏳ Event ${webhookEventId} failed (${responseCode}), retry ${attemptCount}/${MAX_ATTEMPTS} in ${backoffMs}ms`);
  }
}

// Create the BullMQ worker
const worker = new Worker(
  'webhook-deliveries',
  async (job: Job) => {
    await deliverWebhook(job);
  },
  {
    connection: {
      url: process.env.REDIS_URL || 'redis://localhost:6379/0',
    },
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000, // 10 deliveries per second per worker
    },
  },
);

worker.on('completed', (job) => {
  console.log(`[WebhookWorker] Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`[WebhookWorker] Job ${job?.id} failed: ${err.message}`);
});

worker.on('ready', () => {
  console.log('[WebhookWorker] Webhook delivery worker ready and listening');
});

console.log('[WebhookWorker] Starting webhook delivery processor...');
