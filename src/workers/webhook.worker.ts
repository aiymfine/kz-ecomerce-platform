// Webhook Delivery Worker
// Queue: webhook:deliver
// Job data: { webhookId: number, eventType: string, payload: any }
//
// When BullMQ is installed, this will be registered as:
//   new Worker('webhook:deliver', processor, { connection: redis })
//
// For now, this is a stub that logs the delivery attempt.

export class WebhookWorker {
  async process(job: {
    webhookId: number;
    eventType: string;
    payload: any;
  }) {
    console.log(
      `[WebhookWorker] Would deliver event ${job.eventType} to webhook ${job.webhookId}`,
    );
    // TODO: Implement actual HTTP POST with HMAC-SHA256 signature
    // TODO: Exponential backoff on failure
    // TODO: Dead letter queue after 5 attempts
  }
}

export function startWebhookWorker() {
  console.log('[WebhookWorker] Stub started — awaiting BullMQ integration');
}
