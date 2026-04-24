import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Products (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let storeId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);

    // Register merchant and create store
    const email = `product-${Date.now()}@example.com`;
    const regRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password: 'password123', name: 'Product Tester' });
    token = regRes.body.accessToken;

    const storeRes = await request(app.getHttpServer())
      .post('/api/stores')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Product Store', subdomain: `products-${Date.now()}` });
    storeId = storeRes.body.id;
  });

  afterAll(async () => {
    try {
      await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS store_${storeId} CASCADE`);
    } catch {}
    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /api/stores/:storeId/products', () => {
    it('should create a product', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/stores/${storeId}/products`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test Product',
          description: 'A test product',
          status: 'draft',
        })
        .expect(201);

      expect(res.body.title).toBe('Test Product');
      expect(res.body.slug).toBe('test-product');
      expect(res.body.status).toBe('draft');
    });

    it('should auto-generate slug', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/stores/${storeId}/products`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Another Product 123' })
        .expect(201);

      expect(res.body.slug).toBeTruthy();
    });

    it('should reject missing title', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/stores/${storeId}/products`)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);
    });
  });

  describe('GET /api/stores/:storeId/products', () => {
    it('should list products', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/stores/${storeId}/products`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter by status', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/stores/${storeId}/products?status=draft`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.every((p: any) => p.status === 'draft')).toBe(true);
    });
  });

  describe('GET /api/stores/:storeId/products/:id', () => {
    it('should get product details', async () => {
      // Create product first
      const created = await request(app.getHttpServer())
        .post(`/api/stores/${storeId}/products`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Detail Test Product', slug: `detail-${Date.now()}` });

      const res = await request(app.getHttpServer())
        .get(`/api/stores/${storeId}/products/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.title).toBe('Detail Test Product');
    });

    it('should return 404 for non-existent product', async () => {
      await request(app.getHttpServer())
        .get(`/api/stores/${storeId}/products/99999`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('PATCH /api/stores/:storeId/products/:id', () => {
    it('should update a product', async () => {
      const created = await request(app.getHttpServer())
        .post(`/api/stores/${storeId}/products`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Update Test', slug: `update-${Date.now()}` });

      const res = await request(app.getHttpServer())
        .patch(`/api/stores/${storeId}/products/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Title', status: 'active' })
        .expect(200);

      expect(res.body.title).toBe('Updated Title');
      expect(res.body.status).toBe('active');
    });
  });

  describe('DELETE /api/stores/:storeId/products/:id', () => {
    it('should archive a product (soft delete)', async () => {
      const created = await request(app.getHttpServer())
        .post(`/api/stores/${storeId}/products`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Delete Test', slug: `delete-${Date.now()}` });

      const res = await request(app.getHttpServer())
        .delete(`/api/stores/${storeId}/products/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.status).toBe('archived');
    });
  });

  describe('POST /api/stores/:storeId/products/:id/variants', () => {
    it('should generate variant matrix', async () => {
      const created = await request(app.getHttpServer())
        .post(`/api/stores/${storeId}/products`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Variant Test', slug: `variant-${Date.now()}` });

      const res = await request(app.getHttpServer())
        .post(`/api/stores/${storeId}/products/${created.body.id}/variants`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          sizes: ['S', 'M', 'L'],
          colors: ['Red', 'Blue'],
          basePriceTiyin: 500000,
        })
        .expect(201);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('totalGenerated');
      expect(res.body.totalGenerated).toBe(6); // 3 sizes * 2 colors
    });

    it('should reject more than 100 combinations', async () => {
      const created = await request(app.getHttpServer())
        .post(`/api/stores/${storeId}/products`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Too Many', slug: `toomany-${Date.now()}` });

      const res = await request(app.getHttpServer())
        .post(`/api/stores/${storeId}/products/${created.body.id}/variants`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          sizes: Array.from({ length: 11 }, (_, i) => `Size${i}`),
          colors: Array.from({ length: 10 }, (_, i) => `Color${i}`),
          basePriceTiyin: 1000,
        })
        .expect(400);
    });
  });
});
