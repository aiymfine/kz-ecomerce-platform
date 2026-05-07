// Webhook Delivery Worker (legacy entry point)
// Use: pnpm run worker:start (starts all workers including this one)
// The real processor is in: src/workers/processors/webhook-delivery.processor.ts
//
// For direct standalone execution:
//   npx ts-node src/workers/processors/webhook-delivery.processor.ts

export class WebhookWorker {
  async process(job: { webhookId: number; eventType: string; payload: any }) {
    console.log(`[WebhookWorker] Use standalone processor: npx ts-node src/workers/processors/webhook-delivery.processor.ts`);
    console.log(`[WebhookWorker] Event ${job.eventType} for webhook ${job.webhookId} (stub)`);
  }
}

export function startWebhookWorker() {
  console.log('[WebhookWorker] Stub — use the BullMQ processor at src/workers/processors/webhook-delivery.processor.ts');
}
