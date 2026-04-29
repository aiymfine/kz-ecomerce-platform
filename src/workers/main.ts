// Worker Entry Point
//
// When BullMQ is installed, each worker will be registered as:
//   new Worker('queue:name', processor, { connection: redis })
//
// For now, this just starts all stub workers and keeps the process alive.

import { startWebhookWorker } from './webhook.worker';
import { startAbandonedCartsWorker } from './abandoned-carts.worker';
import { startBillingWorker } from './billing.worker';
import { startAuditWorker } from './audit.worker';
import { startInventoryWorker } from './inventory.worker';
import { startEmailsWorker } from './emails.worker';

function main() {
  console.log('========================================');
  console.log('  ShopBuilder Workers Starting...');
  console.log('========================================');

  startWebhookWorker();
  startAbandonedCartsWorker();
  startBillingWorker();
  startAuditWorker();
  startInventoryWorker();
  startEmailsWorker();

  console.log('========================================');
  console.log('  All worker stubs initialized');
  console.log('  (Awaiting BullMQ integration)');
  console.log('========================================');

  // Keep process alive
  setInterval(() => {}, 60000);
}

main();
