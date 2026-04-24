import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Webhooks (e2e)', () => {
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

    const email = `webhook-${Date.now()}@example.com`;
    const regRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password: 'password123', name: 'Webhook Tester' });
    token = regRes.body.accessToken;

    const storeRes = await request(app.getHttpServer())
      .post('/api/stores')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Webhook Store', subdomain: `webhook-${Date.now()}` });
    storeId = storeRes.body.id;
  });

  afterAll(async () => {
    try {
      await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS store_${storeId} CASCADE`);
    } catch {}
    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /api/stores/:storeId/webhooks', () => {
    it('should register a webhook with HMAC secret', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/stores/${storeId}/webhooks`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          url: 'https://example.com/webhook',
          events: ['order.created', 'product.updated'],
        })
        .expect(201);

      expect(res.body.url).toBe('https://example.com/webhook');
      expect(res.body).toHaveProperty('secret');
      expect(res.body.secret).toBeTruthy();
      expect(res.body.secret.length).toBe(64); // hex-encoded 32 bytes
    });

    it('should reject invalid URL', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/stores/${storeId}/webhooks`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          url: 'not-a-url',
          events: ['order.created'],
        })
        .expect(400);
    });

    it('should reject empty events', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/stores/${storeId}/webhooks`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          url: 'https://example.com/webhook',
          events: [],
        })
        .expect(400);
    });
  });

  describe('GET /api/stores/:storeId/webhooks', () => {
    it('should list webhooks', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/stores/${storeId}/webhooks`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('PATCH /api/stores/:storeId/webhooks/:id', () => {
    it('should update webhook', async () => {
      // Create webhook
      const created = await request(app.getHttpServer())
        .post(`/api/stores/${storeId}/webhooks`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          url: 'https://example.com/old',
          events: ['order.created'],
        });

      const res = await request(app.getHttpServer())
        .patch(`/api/stores/${storeId}/webhooks/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          url: 'https://example.com/new',
          events: ['order.created', 'order.deleted'],
        })
        .expect(200);

      expect(res.body.url).toBe('https://example.com/new');
    });

    it('should return 404 for non-existent webhook', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/stores/${storeId}/webhooks/99999`)
        .set('Authorization', `Bearer ${token}`)
        .send({ url: 'https://example.com/new' })
        .expect(404);
    });
  });

  describe('DELETE /api/stores/:storeId/webhooks/:id', () => {
    it('should delete webhook', async () => {
      const created = await request(app.getHttpServer())
        .post(`/api/stores/${storeId}/webhooks`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          url: 'https://example.com/to-delete',
          events: ['test'],
        });

      const res = await request(app.getHttpServer())
        .delete(`/api/stores/${storeId}/webhooks/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.message).toContain('deleted');
    });
  });

  describe('GET /api/stores/:storeId/webhooks/:id/events', () => {
    it('should return empty events list', async () => {
      const created = await request(app.getHttpServer())
        .post(`/api/stores/${storeId}/webhooks`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          url: 'https://example.com/events-test',
          events: ['order.created'],
        });

      const res = await request(app.getHttpServer())
        .get(`/api/stores/${storeId}/webhooks/${created.body.id}/events`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
