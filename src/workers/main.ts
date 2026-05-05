// Worker Entry Point — BullMQ Background Workers
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { startWebhookWorker } from './webhook.worker';
import { startAbandonedCartsWorker } from './abandoned-carts.worker';
import { startBillingWorker } from './billing.worker';
import { startAuditWorker } from './audit.worker';
import { startInventoryWorker } from './inventory.worker';

// Importing the processor modules starts them (side-effect)
import './processors/email.processor';
import './processors/abandoned-cart.processor';

function main() {
  console.log('========================================');
  console.log('  ShopBuilder Workers Starting...');
  console.log('========================================');

  // Real BullMQ workers are started via side-effect imports above

  // Legacy stub workers
  startWebhookWorker();
  startAbandonedCartsWorker();
  startBillingWorker();
  startAuditWorker();
  startInventoryWorker();

  console.log('========================================');
  console.log('  All workers initialized');
  console.log('========================================');

  // Keep process alive
  setInterval(() => {}, 60000);
}

main();
