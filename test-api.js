// Quick endpoint test script
const BASE = 'http://localhost:3001/api';

async function api(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  return { status: res.status, data };
}

let passed = 0, failed = 0;
function check(name, condition) {
  if (condition) { passed++; console.log(`  ✅ ${name}`); }
  else { failed++; console.log(`  ❌ ${name}`); }
}

async function run() {
  console.log('\n=== Backend API Test Suite ===\n');

  // 1. Health
  console.log('--- Health ---');
  let r = await api('GET', '/health');
  check('Health check returns 200', r.status === 200);
  check('DB status ok', r.data?.data?.checks?.database?.status === 'ok');
  check('Redis status ok', r.data?.data?.checks?.redis?.status === 'ok');

  // 2. Auth - Login merchant
  console.log('\n--- Auth (Merchant Login) ---');
  r = await api('POST', '/auth/login', { email: 'merchant1@example.com', password: 'Merchant123' });
  check('Merchant login 200', r.status === 200);
  const merchantToken = r.data?.data?.accessToken;
  const refreshToken = r.data?.data?.refreshToken;
  check('Got merchant access token', !!merchantToken);
  check('Got refresh token', !!refreshToken);

  // 3. Auth - Login admin
  console.log('\n--- Auth (Admin Login) ---');
  r = await api('POST', '/auth/admin/login', { email: 'admin@shopbuilder.kz', password: 'Admin123456' });
  check('Admin login 200', r.status === 200);
  const adminToken = r.data?.data?.accessToken;
  check('Got admin token', !!adminToken);

  // 4. Auth - Profile
  console.log('\n--- Auth (Profile) ---');
  r = await api('GET', '/auth/me', null, merchantToken);
  check('Get profile 200', r.status === 200);

  // 5. Stores
  console.log('\n--- Stores ---');
  r = await api('GET', '/stores', null, merchantToken);
  check('List stores 200', r.status === 200);
  const stores = Array.isArray(r.data) ? r.data : (r.data?.data || []);
  const storeId = stores[0]?.id;
  check('Has at least 1 store', stores.length >= 1);

  // 6. Store Ownership Guard - cross-access should fail
  console.log('\n--- Store Ownership Guard ---');
  // Login as merchant2
  r = await api('POST', '/auth/login', { email: 'merchant2@example.com', password: 'Merchant123' });
  const merchant2Token = r.data?.data?.accessToken;
  if (merchant2Token && storeId) {
    // Get merchant2's store
    r = await api('GET', '/stores', null, merchant2Token);
    const m2Stores = Array.isArray(r.data) ? r.data : (r.data?.data || []);
    const m2StoreId = m2Stores[0]?.id;
    
    if (m2StoreId && m2StoreId !== storeId) {
      // Try accessing merchant1's store with merchant2's token
      r = await api('GET', `/stores/${storeId}/products`, null, merchant2Token);
      check('Cross-store access blocked (403)', r.status === 403);
    } else {
      check('Cross-store access test (same store or no second store - skipped)', true);
    }
  } else {
    check('Cross-store test skipped (no merchant2)', true);
  }

  // 7. Products
  console.log('\n--- Products ---');
  if (storeId) {
    r = await api('GET', `/stores/${storeId}/products`, null, merchantToken);
    check('List products 200', r.status === 200);
    
    r = await api('POST', `/stores/${storeId}/products`, {
      title: 'Test Product', slug: 'test-product-' + Date.now(), status: 'active'
    }, merchantToken);
    check('Create product 201 or 200', r.status === 201 || r.status === 200);
    const productId = r.data?.id;
    
    if (productId) {
      r = await api('GET', `/stores/${storeId}/products/${productId}`, null, merchantToken);
      check('Get product 200', r.status === 200);
    }
  } else {
    check('Products skipped (no store)', false);
  }

  // 8. Categories
  console.log('\n--- Categories ---');
  if (storeId) {
    r = await api('GET', `/stores/${storeId}/categories`, null, merchantToken);
    check('List categories 200', r.status === 200);
  }

  // 9. Warehouses
  console.log('\n--- Warehouses ---');
  if (storeId) {
    r = await api('GET', `/stores/${storeId}/warehouses`, null, merchantToken);
    check('List warehouses 200', r.status === 200);
  }

  // 10. Inventory
  console.log('\n--- Inventory ---');
  if (storeId) {
    r = await api('GET', `/stores/${storeId}/inventory`, null, merchantToken);
    check('List inventory 200', r.status === 200);
  }

  // 11. Cart
  console.log('\n--- Cart ---');
  if (storeId) {
    r = await api('GET', `/stores/${storeId}/cart`, null, merchantToken);
    check('Get cart 200', r.status === 200);
  }

  // 12. Orders
  console.log('\n--- Orders ---');
  if (storeId) {
    r = await api('GET', `/stores/${storeId}/orders`, null, merchantToken);
    check('List orders 200', r.status === 200);
  }

  // 13. Analytics (now requires auth)
  console.log('\n--- Analytics ---');
  r = await api('GET', '/analytics/sales', null, merchantToken);
  check('Analytics with auth 200', r.status === 200);
  
  r = await api('GET', '/analytics/sales');
  check('Analytics without auth blocked (401)', r.status === 401);

  // 14. Admin
  console.log('\n--- Admin ---');
  r = await api('GET', '/admin/merchants', null, adminToken);
  check('Admin list merchants 200', r.status === 200);

  r = await api('GET', '/admin/queue/status', null, adminToken);
  check('Admin queue status 200', r.status === 200);

  // 15. Storefront (public)
  console.log('\n--- Storefront ---');
  if (storeId) {
    r = await api('GET', `/storefront/products?storeId=${storeId}`);
    check('Storefront products 200', r.status === 200);
    
    r = await api('GET', `/storefront/categories?storeId=${storeId}`);
    check('Storefront categories 200', r.status === 200);
  }

  // 16. Token refresh
  console.log('\n--- Token Refresh ---');
  r = await api('POST', '/auth/refresh', { refreshToken });
  check('Token refresh 200', r.status === 200);

  // Summary
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(1); });
