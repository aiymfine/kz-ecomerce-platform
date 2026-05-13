/**
 * Full endpoint integration test — tests the complete flow
 * Run: node test-flow.js
 * Requires: app running on localhost:3000, fresh seed
 */
const http = require('http');

const BASE = 'http://localhost:3000/api';
let token = '';
let adminToken = '';
let cartId = 0;
let orderNumber = '';

function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(data); } catch { parsed = data; }
        resolve({ status: res.statusCode, body: parsed, headers: res.headers });
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
  if (!pass && typeof expected !== 'number') {
    // show body on fail
  }
}

async function run() {
  let r, pass;
  const fails = [];

  console.log('\n🧪 FULL ENDPOINT TEST\n');

  // ========== AUTH ==========
  console.log('📋 AUTH');
  
  r = await request('POST', '/auth/login', { email: 'merchant1@example.com', password: 'Merchant123' });
  pass = r.status === 201 || r.status === 200;
  log('Merchant login', r.status, '2xx', pass);
  if (!pass) fails.push('merchant-login');
  token = r.body.accessToken || r.body.access_token || '';
  console.log(`     Token: ${token ? token.substring(0, 20) + '...' : 'NONE'}`);

  r = await request('POST', '/auth/admin/login', { email: 'admin@shopbuilder.kz', password: 'Admin123456' });
  pass = r.status === 201 || r.status === 200;
  log('Admin login', r.status, '2xx', pass);
  if (!pass) fails.push('admin-login');
  adminToken = r.body.accessToken || r.body.access_token || '';

  // ========== PRODUCTS ==========
  console.log('\n📋 PRODUCTS');

  r = await request('GET', '/stores/1/products', null, { Authorization: `Bearer ${token}` });
  pass = r.status === 200;
  log('List products', r.status, 200, pass);
  if (!pass) fails.push('list-products');
  else console.log(`     Found ${r.body.data?.length || r.body.length || 0} products`);

  r = await request('POST', '/stores/1/products', { title: 'Test Product', slug: 'test-prod-' + Date.now(), description: 'test', status: 'active' }, { Authorization: `Bearer ${token}` });
  pass = r.status === 201 || r.status === 200;
  log('Create product', r.status, '2xx', pass);
  if (!pass) fails.push('create-product');

  // ========== CATEGORIES ==========
  console.log('\n📋 CATEGORIES');

  r = await request('GET', '/stores/1/categories', null, { Authorization: `Bearer ${token}` });
  pass = r.status === 200;
  log('List categories', r.status, 200, pass);
  if (!pass) fails.push('list-categories');

  // ========== CART ==========
  console.log('\n📋 CART');

  r = await request('GET', '/stores/1/cart', null, { Authorization: `Bearer ${token}` });
  pass = r.status === 200;
  log('Get/create cart', r.status, 200, pass);
  if (!pass) { fails.push('get-cart'); console.log('     Error:', JSON.stringify(r.body).substring(0, 200)); }
  else { cartId = r.body.id; console.log(`     Cart ID: ${cartId}`); }

  r = await request('POST', '/stores/1/cart/items', { variant_id: 1, quantity: 2 }, { Authorization: `Bearer ${token}` });
  pass = r.status === 201 || r.status === 200;
  log('Add item to cart', r.status, '2xx', pass);
  if (!pass) { fails.push('add-cart-item'); console.log('     Error:', JSON.stringify(r.body).substring(0, 200)); }

  r = await request('POST', '/stores/1/cart/items', { variant_id: 3, quantity: 1 }, { Authorization: `Bearer ${token}` });
  pass = r.status === 201 || r.status === 200;
  log('Add second item', r.status, '2xx', pass);
  if (!pass) { fails.push('add-cart-item-2'); console.log('     Error:', JSON.stringify(r.body).substring(0, 200)); }

  // ========== CHECKOUT ==========
  console.log('\n📋 CHECKOUT');

  r = await request('POST', '/stores/1/orders/checkout', { shipping_method: 'self_pickup' }, { Authorization: `Bearer ${token}` });
  pass = r.status === 201;
  log('Checkout (cart → order)', r.status, 201, pass);
  if (!pass) { fails.push('checkout'); console.log('     Error:', JSON.stringify(r.body).substring(0, 300)); }
  else { orderNumber = r.body.orderNumber; console.log(`     Order: ${orderNumber}, Total: ${r.body.totalTiyin} tiyin`); }

  // ========== ORDERS ==========
  console.log('\n📋 ORDERS');

  r = await request('GET', '/stores/1/orders', null, { Authorization: `Bearer ${token}` });
  pass = r.status === 200;
  log('List orders', r.status, 200, pass);
  if (!pass) fails.push('list-orders');

  if (orderNumber) {
    r = await request('GET', `/stores/1/orders/${orderNumber}`, null, { Authorization: `Bearer ${token}` });
    pass = r.status === 200;
    log('Get order by number', r.status, 200, pass);
    if (!pass) fails.push('get-order');
  }

  // ========== PAYMENTS ==========
  console.log('\n📋 PAYMENTS');

  if (orderNumber) {
    // Get order ID from order number
    r = await request('GET', `/stores/1/orders/${orderNumber}`, null, { Authorization: `Bearer ${token}` });
    const orderId = r.body?.id;
    
    if (orderId) {
      // Simulate payment (demo endpoint)
      r = await request('POST', `/stores/1/payments/simulate/${orderId}`, {}, { Authorization: `Bearer ${token}` });
      pass = r.status === 200 || r.status === 201;
      log('Simulate payment', r.status, '2xx', pass);
      if (!pass) { fails.push('simulate-payment'); console.log('     Error:', JSON.stringify(r.body).substring(0, 200)); }
      else console.log(`     Payment: ${r.body?.payment?.status || 'unknown'}`);

      // Get payments for order
      r = await request('GET', `/stores/1/payments/order/${orderId}`, null, { Authorization: `Bearer ${token}` });
      pass = r.status === 200;
      log('Get order payments', r.status, 200, pass);
      if (!pass) fails.push('get-payments');
    }
  }

  // ========== INVENTORY ==========
  console.log('\n📋 INVENTORY');

  r = await request('GET', '/stores/1/inventory', null, { Authorization: `Bearer ${token}` });
  pass = r.status === 200;
  log('List inventory', r.status, 200, pass);
  if (!pass) fails.push('list-inventory');

  // ========== WAREHOUSES ==========
  console.log('\n📋 WAREHOUSES');

  r = await request('GET', '/stores/1/warehouses', null, { Authorization: `Bearer ${token}` });
  pass = r.status === 200;
  log('List warehouses', r.status, 200, pass);
  if (!pass) fails.push('list-warehouses');

  // ========== WEBHOOKS ==========
  console.log('\n📋 WEBHOOKS');

  r = await request('GET', '/stores/1/webhooks', null, { Authorization: `Bearer ${token}` });
  pass = r.status === 200;
  log('List webhooks', r.status, 200, pass);
  if (!pass) fails.push('list-webhooks');

  // ========== ADMIN ==========
  console.log('\n📋 ADMIN');

  r = await request('GET', '/admin/merchants', null, { Authorization: `Bearer ${adminToken}` });
  pass = r.status === 200;
  log('Admin list merchants', r.status, 200, pass);
  if (!pass) fails.push('admin-merchants');

  r = await request('GET', '/admin/stores', null, { Authorization: `Bearer ${adminToken}` });
  pass = r.status === 200;
  log('Admin list stores', r.status, 200, pass);
  if (!pass) fails.push('admin-stores');

  r = await request('GET', '/admin/queue/status', null, { Authorization: `Bearer ${adminToken}` });
  pass = r.status === 200;
  log('Admin queue status', r.status, 200, pass);
  if (!pass) fails.push('admin-queue');

  // ========== HEALTH ==========
  console.log('\n📋 HEALTH');

  r = await request('GET', '/health');
  pass = r.status === 200;
  log('Health check', r.status, 200, pass);
  if (!pass) fails.push('health');

  // ========== STOREFRONT ==========
  console.log('\n📋 STOREFRONT');

  r = await request('GET', '/storefront/products?storeId=1');
  pass = r.status === 200;
  log('Storefront products', r.status, 200, pass);
  if (!pass) fails.push('storefront-products');

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
