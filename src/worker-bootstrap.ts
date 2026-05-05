// Standalone Worker Bootstrap
// Run with: pnpm run worker:start
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Importing the processor modules starts them (side-effect)
import './workers/processors/email.processor';
import './workers/processors/abandoned-cart.processor';

function main() {
  console.log('========================================');
  console.log('  ShopBuilder Worker Bootstrap');
  console.log('========================================');
  console.log('  Workers running. Press Ctrl+C to stop.');
  console.log('========================================');

  process.on('SIGINT', () => {
    console.log('\nShutting down workers...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\nShutting down workers...');
    process.exit(0);
  });

  // Keep process alive
  setInterval(() => {}, 60000);
}

main();
