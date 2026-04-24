import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const tenantTables = [
  'products',
  'product_images',
  'categories',
  'product_categories',
  'variant_attributes',
  'variant_attribute_values',
  'product_variants',
  'warehouses',
  'inventory',
  'customers',
  'addresses',
  'cart_items',
  'carts',
  'orders',
  'order_items',
  'payments',
  'order_fulfillments',
  'promo_codes',
  'order_discounts',
  'webhooks',
  'webhook_events',
  'subscription_boxes',
  'subscription_box_items',
  'subscription_orders',
  'staff_members',
  'theme_templates',
  'abandoned_carts',
  'store_audit_log',
];

// Tables with updated_at but NO database default (Prisma @updatedAt)
const tablesWithUpdatedAt = [
  'products',
  'product_variants',
  'customers',
  'carts',
  'cart_items',
  'orders',
  'staff_members',
  'theme_templates',
  'inventory',
  'abandoned_carts',
];

async function provisionTenant(storeId: number) {
  const schema = `store_${storeId}`;
  console.log(`  Provisioning tenant schema ${schema}...`);

  // Drop existing and recreate
  await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
  await prisma.$executeRawUnsafe(`CREATE SCHEMA ${schema}`);

  // Create tables using LIKE
  for (const table of tenantTables) {
    await prisma.$executeRawUnsafe(
      `CREATE TABLE ${schema}.${table} (LIKE public.${table} INCLUDING ALL)`,
    );
  }

  // Fix updated_at columns: add DEFAULT NOW() so raw SQL works
  for (const table of tablesWithUpdatedAt) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE ${schema}.${table} ALTER COLUMN updated_at SET DEFAULT NOW()`,
    );
  }

  // Insert default categories
  const categories = [
    ['Все товары', 'all', '/1/', 0, 0],
    ['Электроника', 'electronics', '/2/', 0, 1],
    ['Одежда', 'clothing', '/3/', 0, 2],
    ['Аксессуары', 'accessories', '/4/', 0, 3],
    ['Новинки', 'new-arrivals', '/5/', 0, 4],
    ['Распродажа', 'sale', '/6/', 0, 5],
  ];
  for (const [name, slug, path, depth, sortOrder] of categories) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO ${schema}.categories (name, slug, path, depth, sort_order) VALUES ('${name}', '${slug}', '${path}', ${depth}, ${sortOrder})`,
    );
  }

  console.log(`  ✓ Tenant ${schema} provisioned`);
}

async function seedTenant(storeId: number, storeName: string) {
  const schema = `store_${storeId}`;
  console.log(`  Seeding data for ${storeName} (${schema})...`);

  // Products — only specify columns without defaults
  await prisma.$executeRawUnsafe(`
    INSERT INTO ${schema}.products (title, slug, description, status, weight_grams) VALUES
      ('Телефон Samsung Galaxy A54', 'samsung-galaxy-a54', 'Флагманский смартфон Samsung', 'active', 200),
      ('Наушники AirPods Pro', 'airpods-pro', 'Беспроводные наушники', 'active', 50),
      ('Чехол для iPhone 15', 'iphone-15-case', 'Силиконовый чехол', 'active', 30),
      ('Кроссовки Nike Air Max', 'nike-air-max', 'Спортивные кроссовки', 'active', 400),
      ('Рюкзак для ноутбука', 'laptop-backpack', 'Вместительный рюкзак', 'active', 600)
  `);

  // Variant attributes
  await prisma.$executeRawUnsafe(`
    INSERT INTO ${schema}.variant_attributes (name, type) VALUES
      ('Размер', 'size'),
      ('Цвет', 'color'),
      ('Материал', 'material')
  `);

  // Product variants
  await prisma.$executeRawUnsafe(`
    INSERT INTO ${schema}.product_variants (product_id, sku, price_tiyin, is_active, position) VALUES
      (1, 'samsung-galaxy-a54-black', 28990000, true, 0),
      (1, 'samsung-galaxy-a54-white', 28990000, true, 1),
      (2, 'airpods-pro', 42990000, true, 0),
      (3, 'iphone-15-case-black', 499000, true, 0),
      (3, 'iphone-15-case-clear', 499000, true, 1),
      (4, 'nike-air-max-42', 8990000, true, 0),
      (4, 'nike-air-max-43', 8990000, true, 1),
      (4, 'nike-air-max-44', 9490000, true, 2),
      (5, 'laptop-backpack-black', 1599000, true, 0),
      (5, 'laptop-backpack-grey', 1599000, true, 1)
  `);

  // Variant attribute values
  await prisma.$executeRawUnsafe(`
    INSERT INTO ${schema}.variant_attribute_values (variant_id, attribute_id, value) VALUES
      (1, 2, 'Black'),
      (2, 2, 'White'),
      (6, 1, '42'),
      (7, 1, '43'),
      (8, 1, '44'),
      (9, 2, 'Black'),
      (10, 2, 'Grey')
  `);

  // Webhooks
  await prisma.$executeRawUnsafe(`
    INSERT INTO ${schema}.webhooks (url, secret, events, is_active) VALUES
      ('https://example.com/webhook', '${Array.from({ length: 64 }, () => '0').join('')}', '["order.created","product.updated"]'::json, true)
  `);

  console.log(`  ✓ ${storeName} seeded`);
}

async function main() {
  console.log('🌱 Seeding database...\n');

  // 1. Create platform admin
  console.log('1. Creating platform admin...');
  const adminPassword = await bcrypt.hash('admin123456', 12);
  const admin = await prisma.platformAdmin.upsert({
    where: { email: 'admin@shopbuilder.kz' },
    update: {},
    create: {
      email: 'admin@shopbuilder.kz',
      passwordHash: adminPassword,
      name: 'Platform Admin',
      role: 'super_admin',
    },
  });
  console.log(`  ✓ Admin: ${admin.email} (password: admin123456)\n`);

  // 2. Create merchants
  console.log('2. Creating merchants...');
  const m1Pass = await bcrypt.hash('merchant123', 12);
  const merchant1 = await prisma.merchant.upsert({
    where: { email: 'merchant1@example.com' },
    update: {},
    create: {
      email: 'merchant1@example.com',
      passwordHash: m1Pass,
      name: 'Айдана Касымова',
      phone: '+7 701 234 5678',
      businessName: 'TechShop KZ',
      status: 'approved',
      isActive: true,
    },
  });
  console.log(`  ✓ Merchant 1: ${merchant1.email} (password: merchant123)`);

  const m2Pass = await bcrypt.hash('merchant123', 12);
  const merchant2 = await prisma.merchant.upsert({
    where: { email: 'merchant2@example.com' },
    update: {},
    create: {
      email: 'merchant2@example.com',
      passwordHash: m2Pass,
      name: 'Бекзат Нурланов',
      phone: '+7 702 345 6789',
      businessName: 'FashionStore KZ',
      status: 'approved',
      isActive: true,
    },
  });
  console.log(`  ✓ Merchant 2: ${merchant2.email} (password: merchant123)\n`);

  // 3. Create stores
  console.log('3. Creating stores...');
  const store1 = await prisma.store.upsert({
    where: { subdomain: 'techshop' },
    update: {},
    create: {
      merchantId: merchant1.id,
      name: 'TechShop KZ',
      subdomain: 'techshop',
      schemaName: `store_${merchant1.id}`,
      status: 'active',
      plan: 'starter',
      isLive: true,
    },
  });
  console.log(`  ✓ Store 1: ${store1.name} (${store1.subdomain})`);

  const store2 = await prisma.store.upsert({
    where: { subdomain: 'fashionstore' },
    update: {},
    create: {
      merchantId: merchant2.id,
      name: 'FashionStore KZ',
      subdomain: 'fashionstore',
      schemaName: `store_${merchant2.id}`,
      status: 'active',
      plan: 'starter',
      isLive: true,
    },
  });
  console.log(`  ✓ Store 2: ${store2.name} (${store2.subdomain})\n`);

  // 4. Provision tenant schemas (always drop + recreate)
  console.log('4. Provisioning tenant schemas...');
  await provisionTenant(store1.id);
  await provisionTenant(store2.id);
  console.log();

  // 5. Seed tenant data
  console.log('5. Seeding tenant data...');
  await seedTenant(store1.id, store1.name);
  await seedTenant(store2.id, store2.name);
  console.log();

  // 6. Provisioning logs
  console.log('6. Creating provisioning logs...');
  await prisma.tenantProvisioningLog.upsert({
    where: { id: 1 },
    update: {},
    create: {
      storeId: store1.id,
      action: 'seed',
      status: 'completed',
      details: { source: 'prisma-seed' },
    },
  });
  await prisma.tenantProvisioningLog.upsert({
    where: { id: 2 },
    update: {},
    create: {
      storeId: store2.id,
      action: 'seed',
      status: 'completed',
      details: { source: 'prisma-seed' },
    },
  });

  console.log('\n✅ Seed completed successfully!');
  console.log('\n📋 Test accounts:');
  console.log('  Admin:    admin@shopbuilder.kz / admin123456');
  console.log('  Merchant: merchant1@example.com / merchant123');
  console.log('  Merchant: merchant2@example.com / merchant123');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
