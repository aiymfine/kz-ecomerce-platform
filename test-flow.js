/**
 * Full endpoint integration test — tests the complete flow
 * Run: node test-flow.js
 * Requires: app running on localhost:3001, fresh seed
 */
const http = require('http');

const BASE = 'http://localhost:3001/api';

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers,
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(data); } catch { parsed = data; }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function log(test, status, expected, pass) {
  const icon = pass ? '✅' : '❌';
  console.log(`  ${icon} ${test}: ${status} (expected ${expected})`);
}

async function run() {
  let r, pass;
  const fails = [];

  console.log('\n🧪 FULL ENDPOINT TEST\n');

  // ========== AUTH ==========
  console.log('📋 AUTH');

  r = await request('POST', '/auth/login', { email: 'merchant1@example.com', password: 'Merchant123' });
  pass = r.status === 200 || r.status === 201;
  log('Merchant login', r.status, '2xx', pass);
  if (!pass) { fails.push('merchant-login'); console.log('     Body:', JSON.stringify(r.body).substring(0, 200)); }
  const token = r.body?.data?.accessToken || '';
  console.log(`     Token: ${token ? token.substring(0, 20) + '...' : 'NONE'}`);

  r = await request('POST', '/auth/admin/login', { email: 'admin@shopbuilder.kz', password: 'Admin123456' });
  pass = r.status === 200 || r.status === 201;
  log('Admin login', r.status, '2xx', pass);
  if (!pass) { fails.push('admin-login'); console.log('     Body:', JSON.stringify(r.body).substring(0, 200)); }
  const adminToken = r.body?.data?.accessToken || '';

  // ========== HEALTH ==========
  console.log('\n📋 HEALTH');

  r = await request('GET', '/health');
  pass = r.status === 200;
  log('Health check', r.status, 200, pass);
  if (!pass) fails.push('health');
  else console.log(`     DB: ${r.body?.data?.checks?.database?.status} | Redis: ${r.body?.data?.checks?.redis?.status}`);

  // ========== PRODUCTS ==========
  console.log('\n📋 PRODUCTS');

  r = await request('GET', '/stores/1/products', null, token);
  pass = r.status === 200;
  log('List products', r.status, 200, pass);
  if (!pass) { fails.push('list-products'); console.log('     Body:', JSON.stringify(r.body).substring(0, 200)); }
  else console.log(`     Found ${r.body?.data?.length || r.body?.length || 0} products`);

  // ========== CART ==========
  console.log('\n📋 CART');

  r = await request('GET', '/stores/1/cart', null, token);
  pass = r.status === 200;
  log('Get/create cart', r.status, 200, pass);
  if (!pass) { fails.push('get-cart'); console.log('     Error:', JSON.stringify(r.body).substring(0, 200)); }
  else console.log(`     Cart ID: ${r.body?.id || r.body?.data?.id}`);

  r = await request('POST', '/stores/1/cart/items', { variant_id: 1, quantity: 2 }, token);
  pass = r.status === 200 || r.status === 201;
  log('Add item to cart (variant 1)', r.status, '2xx', pass);
  if (!pass) { fails.push('add-cart-item'); console.log('     Error:', JSON.stringify(r.body).substring(0, 300)); }

  r = await request('POST', '/stores/1/cart/items', { variant_id: 3, quantity: 1 }, token);
  pass = r.status === 200 || r.status === 201;
  log('Add second item (variant 3)', r.status, '2xx', pass);
  if (!pass) { fails.push('add-cart-item-2'); console.log('     Error:', JSON.stringify(r.body).substring(0, 300)); }

  // ========== CHECKOUT ==========
  console.log('\n📋 CHECKOUT');

  r = await request('POST', '/stores/1/orders/checkout', { shipping_method: 'self_pickup' }, token);
  pass = r.status === 201;
  log('Checkout (cart → order)', r.status, 201, pass);
  if (!pass) { fails.push('checkout'); console.log('     Error:', JSON.stringify(r.body).substring(0, 300)); }
  else {
    const order = r.body;
    console.log(`     Order: ${order?.orderNumber}, Total: ${order?.totalTiyin} tiyin`);
    
    // ========== PAYMENTS ==========
    console.log('\n📋 PAYMENTS');
    
    const orderId = order?.id;
    if (orderId) {
      r = await request('POST', `/stores/1/payments/simulate/${orderId}`, {}, token);
      pass = r.status === 200 || r.status === 201;
      log('Simulate payment', r.status, '2xx', pass);
      if (!pass) { fails.push('simulate-payment'); console.log('     Error:', JSON.stringify(r.body).substring(0, 200)); }
      else console.log(`     Payment: ${r.body?.payment?.status || r.body?.message}`);
    }
  }

  // ========== ORDERS ==========
  console.log('\n📋 ORDERS');

  r = await request('GET', '/stores/1/orders', null, token);
  pass = r.status === 200;
  log('List orders', r.status, 200, pass);
  if (!pass) fails.push('list-orders');

  // ========== INVENTORY ==========
  console.log('\n📋 INVENTORY');

  r = await request('GET', '/stores/1/inventory', null, token);
  pass = r.status === 200;
  log('List inventory', r.status, 200, pass);
  if (!pass) { fails.push('list-inventory'); console.log('     Error:', JSON.stringify(r.body).substring(0, 200)); }

  // ========== WAREHOUSES ==========
  console.log('\n📋 WAREHOUSES');

  r = await request('GET', '/stores/1/warehouses', null, token);
  pass = r.status === 200;
  log('List warehouses', r.status, 200, pass);
  if (!pass) fails.push('list-warehouses');

  // ========== WEBHOOKS ==========
  console.log('\n📋 WEBHOOKS');

  r = await request('GET', '/stores/1/webhooks', null, token);
  pass = r.status === 200;
  log('List webhooks', r.status, 200, pass);
  if (!pass) fails.push('list-webhooks');

  // ========== ANALYTICS ==========
  console.log('\n📋 ANALYTICS');

  r = await request('GET', '/analytics/sales', null, token);
  pass = r.status === 200;
  log('Sales analytics', r.status, 200, pass);
  if (!pass) { fails.push('analytics-sales'); console.log('     Error:', JSON.stringify(r.body).substring(0, 200)); }

  r = await request('GET', '/analytics/inventory', null, token);
  pass = r.status === 200;
  log('Inventory analytics', r.status, 200, pass);
  if (!pass) { fails.push('analytics-inventory'); }

  // ========== STOREFRONT ==========
  console.log('\n📋 STOREFRONT');

  r = await request('GET', '/storefront/products?storeId=1');
  pass = r.status === 200;
  log('Storefront products', r.status, 200, pass);
  if (!pass) { fails.push('storefront-products'); console.log('     Error:', JSON.stringify(r.body).substring(0, 200)); }

  r = await request('GET', '/storefront/categories?storeId=1');
  pass = r.status === 200;
  log('Storefront categories', r.status, 200, pass);
  if (!pass) fails.push('storefront-categories');

  // ========== ADMIN ==========
  console.log('\n📋 ADMIN');

  r = await request('GET', '/admin/merchants', null, adminToken);
  pass = r.status === 200;
  log('Admin list merchants', r.status, 200, pass);
  if (!pass) { fails.push('admin-merchants'); console.log('     Error:', JSON.stringify(r.body).substring(0, 200)); }

  r = await request('GET', '/admin/stores', null, adminToken);
  pass = r.status === 200;
  log('Admin list stores', r.status, 200, pass);
  if (!pass) fails.push('admin-stores');

  r = await request('GET', '/admin/queue/status', null, adminToken);
  pass = r.status === 200;
  log('Admin queue status', r.status, 200, pass);
  if (!pass) fails.push('admin-queue');

  // ========== SUMMARY ==========
  console.log('\n' + '='.repeat(50));
  if (fails.length === 0) {
    console.log('🎉 ALL TESTS PASSED!');
  } else {
    console.log(`⚠️  ${fails.length} FAILED:`);
    fails.forEach(f => console.log(`   ❌ ${f}`));
  }
  console.log('='.repeat(50) + '\n');

  process.exit(fails.length > 0 ? 1 : 0);
}

run().catch(e => {
  console.error('Test runner error:', e.message);
  process.exit(1);
});
