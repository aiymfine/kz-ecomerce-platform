// Subscription Billing Worker
// Queue: billing:process
// Job data: { subscriptionOrderId: number }
//
// When BullMQ is installed, this will be registered as:
//   new Worker('billing:process', processor, { connection: redis })
//
// For now, this is a stub that logs what it would do.

export class BillingWorker {
  async process(job: { subscriptionOrderId: number }) {
    console.log(
      `[BillingWorker] Would process billing for subscription order ${job.subscriptionOrderId}`,
    );
    // TODO: Check subscription status (active, paused, cancelled, dunning)
    // TODO: Create payment record
    // TODO: Call payment provider (Kaspi Pay / Halyk Bank)
    // TODO: Update payment status on result
    // TODO: Handle dunning if payment fails
    // TODO: Increment cycle number on success
  }
}

export function startBillingWorker() {
  console.log('[BillingWorker] Stub started — awaiting BullMQ integration');
}
