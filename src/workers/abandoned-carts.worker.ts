// Abandoned Cart Scanner Worker
// Queue: abandoned-cart:scan
// Job data: { storeId?: number } (optional store filter)
//
// When BullMQ is installed, this will be registered as:
//   new Worker('abandoned-cart:scan', processor, { connection: redis })
//
// For now, this is a stub that logs what it would do.

export class AbandonedCartsWorker {
  async process(job: { storeId?: number }) {
    console.log(
      `[AbandonedCartsWorker] Would scan for abandoned carts${job.storeId ? ` in store ${job.storeId}` : ''}`,
    );
    // TODO: Query carts with status=active, updatedAt < 1 hour ago
    // TODO: Mark as abandoned, generate recovery code
    // TODO: Trigger email worker for recovery email
    // TODO: Apply discount if configured
  }
}

export function startAbandonedCartsWorker() {
  console.log('[AbandonedCartsWorker] Stub started — awaiting BullMQ integration');
}
