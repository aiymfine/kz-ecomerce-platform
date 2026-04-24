import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('Tenant Isolation (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let store1Id: number;
  let store2Id: number;
  let token1: string;
  let token2: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);

    // Create two merchants
    const email1 = `tenant1-${Date.now()}@example.com`;
    const email2 = `tenant2-${Date.now()}@example.com`;

    const reg1 = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: email1, password: 'password123', name: 'Tenant 1' });
    token1 = reg1.body.accessToken;

    const reg2 = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: email2, password: 'password123', name: 'Tenant 2' });
    token2 = reg2.body.accessToken;

    // Create stores
    const store1Res = await request(app.getHttpServer())
      .post('/api/stores')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        name: 'Tenant 1 Store',
        subdomain: `tenant1-${Date.now()}`,
      });
    store1Id = store1Res.body.id;

    const store2Res = await request(app.getHttpServer())
      .post('/api/stores')
      .set('Authorization', `Bearer ${token2}`)
      .send({
        name: 'Tenant 2 Store',
        subdomain: `tenant2-${Date.now()}`,
      });
    store2Id = store2Res.body.id;
  });

  afterAll(async () => {
    // Clean up tenant schemas
    try {
      await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS store_${store1Id} CASCADE`);
      await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS store_${store2Id} CASCADE`);
    } catch {}

    await prisma.$disconnect();
    await app.close();
  });

  it('should isolate products between tenants', async () => {
    // Create product in store 1
    await request(app.getHttpServer())
      .post(`/api/stores/${store1Id}/products`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ title: 'Store 1 Product', slug: 'store1-product' })
      .expect(201);

    // Create product in store 2
    await request(app.getHttpServer())
      .post(`/api/stores/${store2Id}/products`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ title: 'Store 2 Product', slug: 'store2-product' })
      .expect(201);

    // Store 1 should only see its product
    const res1 = await request(app.getHttpServer())
      .get(`/api/stores/${store1Id}/products`)
      .set('Authorization', `Bearer ${token1}`)
      .expect(200);

    expect(res1.body.data).toHaveLength(1);
    expect(res1.body.data[0].title).toBe('Store 1 Product');

    // Store 2 should only see its product
    const res2 = await request(app.getHttpServer())
      .get(`/api/stores/${store2Id}/products`)
      .set('Authorization', `Bearer ${token2}`)
      .expect(200);

    expect(res2.body.data).toHaveLength(1);
    expect(res2.body.data[0].title).toBe('Store 2 Product');
  });

  it('should not allow cross-tenant product access', async () => {
    // Create product in store 1
    const productRes = await request(app.getHttpServer())
      .post(`/api/stores/${store1Id}/products`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ title: 'Private Product', slug: `private-${Date.now()}` })
      .expect(201);

    const productId = productRes.body.id;

    // Try to access from store 2 (should still work due to search_path on store 2)
    // But product should not exist in store 2's schema
    const res = await request(app.getHttpServer())
      .get(`/api/stores/${store2Id}/products/${productId}`)
      .set('Authorization', `Bearer ${token2}`);

    // Product should not be found in store 2's schema
    expect(res.status).toBe(404);
  });
});
