// Expired Inventory Reservation Releaser Worker
// Queue: inventory:release-expired
// Job data: { warehouseId?: number } (optional warehouse filter)
//
// When BullMQ is installed, this will be registered as:
//   new Worker('inventory:release-expired', processor, { connection: redis })
//
// For now, this is a stub that logs what it would do.

export class InventoryWorker {
  async process(job: { warehouseId?: number }) {
    console.log(
      `[InventoryWorker] Would release expired reservations${job.warehouseId ? ` in warehouse ${job.warehouseId}` : ''}`,
    );
    // TODO: Find reservations where order is still payment_pending and created_at > 30 min ago
    // TODO: Decrement quantityReserved, increment quantityAvailable
    // TODO: Log the release for audit trail
  }
}

export function startInventoryWorker() {
  console.log('[InventoryWorker] Stub started — awaiting BullMQ integration');
}
