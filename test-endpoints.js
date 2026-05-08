const http = require('http');

const BASE = 'http://localhost:3001';

async function request(method, path, body, token) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE);
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    };
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(url, opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', (e) => resolve({ status: 0, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, error: 'timeout' }); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  // Get tokens
  const admin = await request('POST', '/api/auth/admin/login', { email: 'admin@shopbuilder.kz', password: 'Admin123456' });
  const merchant = await request('POST', '/api/auth/login', { email: 'merchant1@example.com', password: 'Merchant123' });
  const at = JSON.parse(admin.body).data?.accessToken;
  const mt = JSON.parse(merchant.body).data?.accessToken;
  console.log(`Admin: ${at ? 'OK' : 'FAIL'}, Merchant: ${mt ? 'OK' : 'FAIL'}`);

  const tests = [
    // AUTH
    ['AUTH: Login', 'POST', '/api/auth/login', { email: 'merchant1@example.com', password: 'Merchant123' }, null, 200],
    ['AUTH: Admin Login', 'POST', '/api/auth/admin/login', { email: 'admin@shopbuilder.kz', password: 'Admin123456' }, null, 200],
    ['AUTH: Profile', 'GET', '/api/auth/me', null, mt, 200],
    ['AUTH: Forgot PW', 'POST', '/api/auth/forgot-password', { email: 'admin@shopbuilder.kz' }, null, 200],
    ['AUTH: Weak Pw', 'POST', '/api/auth/register', { email: 'weak@test.com', password: '123', name: 'T' }, null, 400],
    ['AUTH: No Auth', 'GET', '/api/auth/me', null, null, 401],
    // ADMIN
    ['ADMIN: Merchants', 'GET', '/api/admin/merchants', null, at, 200],
    ['ADMIN: Stores', 'GET', '/api/admin/stores', null, at, 200],
    ['ADMIN: Analytics', 'GET', '/api/admin/analytics', null, at, 200],
    ['ADMIN: Queue', 'GET', '/api/admin/queue/status', null, at, 200],
    ['ADMIN: Audit', 'GET', '/api/admin/audit-log', null, at, 200],
    ['ADMIN: RBAC 403', 'GET', '/api/admin/merchants', null, mt, 403],
    // STORES
    ['STORES: List', 'GET', '/api/stores', null, mt, 200],
    ['STORES: Get', 'GET', '/api/stores/1', null, mt, 200],
    // PRODUCTS
    ['PROD: List', 'GET', '/api/stores/1/products', null, mt, 200],
    ['PROD: Get', 'GET', '/api/stores/1/products/91', null, mt, 200], // actual product ID
    // CATEGORIES
    ['CAT: List', 'GET', '/api/stores/1/categories', null, mt, 200],
    // WAREHOUSES
    ['WH: List', 'GET', '/api/stores/1/warehouses', null, mt, 200],
    // INVENTORY
    ['INV: List', 'GET', '/api/stores/1/inventory?limit=5', null, mt, 200],
    // CART
    ['CART: Get', 'GET', '/api/stores/1/cart', null, mt, 200],
    // ORDERS
    ['ORD: List', 'GET', '/api/stores/1/orders', null, mt, 200],
    // STOREFRONT (no auth)
    ['SF: Products', 'GET', '/api/storefront/products?storeId=1', null, null, 200],
    ['SF: Categories', 'GET', '/api/storefront/categories?storeId=1', null, null, 200],
    // WEBHOOKS
    ['WHOOK: List', 'GET', '/api/stores/1/webhooks', null, mt, 200],
    // STAFF
    ['STAFF: List', 'GET', '/api/stores/1/staff', null, mt, 200],
    // DISCOUNTS
    ['DISC: List', 'GET', '/api/stores/1/promo-codes', null, mt, 200],
    // SWAGGER
    ['SWAGGER', 'GET', '/docs-json', null, null, 200],
  ];

  let ok = 0, fail = 0;
  for (const [name, method, path, body, token, expected] of tests) {
    const r = await request(method, path, body, token);
    const pass = r.status === expected;
    if (pass) { ok++; console.log(`  OK   ${name} -> ${r.status}`); }
    else { fail++; console.log(`  FAIL ${name} -> ${r.status} (expected ${expected})`); }
  }
  console.log(`\n=== RESULT: ${ok} OK, ${fail} FAIL out of ${ok + fail} ===`);
  process.exit(fail > 0 ? 1 : 0);
}

main();
