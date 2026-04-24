import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

describe('Admin (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);

    // Create admin user
    const passwordHash = await bcrypt.hash('admin123', 12);
    await prisma.platformAdmin.upsert({
      where: { email: 'test-admin@shopbuilder.kz' },
      update: {},
      create: {
        email: 'test-admin@shopbuilder.kz',
        passwordHash,
        name: 'Test Admin',
        role: 'super_admin',
      },
    });

    // Login as admin
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'test-admin@shopbuilder.kz', password: 'admin123' });

    // If admin login fails (auth.service only handles merchant), create token manually
    if (!loginRes.body.accessToken) {
      const admin = await prisma.platformAdmin.findUnique({
        where: { email: 'test-admin@shopbuilder.kz' },
      });
      adminToken = jwtService.sign({
        sub: admin!.id,
        email: admin!.email,
        role: admin!.role,
      });
    } else {
      adminToken = loginRes.body.accessToken;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('GET /api/admin/merchants', () => {
    it('should list merchants', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/merchants')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter by status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/merchants?status=pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(
        res.body.data.every((m: any) => m.status === 'pending'),
      ).toBe(true);
    });
  });

  describe('GET /api/admin/merchants/:id', () => {
    it('should get merchant details', async () => {
      // Create a test merchant
      const email = `admin-test-${Date.now()}@example.com`;
      await prisma.merchant.create({
        data: {
          email,
          passwordHash: await bcrypt.hash('password', 12),
          name: 'Test',
          status: 'pending',
        },
      });

      const merchant = await prisma.merchant.findUnique({ where: { email } });

      const res = await request(app.getHttpServer())
        .get(`/api/admin/merchants/${merchant!.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.email).toBe(email);
      expect(res.body).not.toHaveProperty('passwordHash');
    });
  });

  describe('POST /api/admin/merchants/:id/approve', () => {
    it('should approve merchant and create store', async () => {
      const email = `approve-${Date.now()}@example.com`;
      const merchant = await prisma.merchant.create({
        data: {
          email,
          passwordHash: await bcrypt.hash('password', 12),
          name: 'Approve Test',
          status: 'pending',
        },
      });

      const res = await request(app.getHttpServer())
        .post(`/api/admin/merchants/${merchant.id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('merchant');
      expect(res.body).toHaveProperty('store');
      expect(res.body.merchant.status).toBe('approved');

      // Clean up
      try {
        await prisma.$executeRawUnsafe(
          `DROP SCHEMA IF EXISTS store_${merchant.id} CASCADE`,
        );
      } catch {}
    });
  });

  describe('POST /api/admin/merchants/:id/reject', () => {
    it('should reject merchant with reason', async () => {
      const email = `reject-${Date.now()}@example.com`;
      const merchant = await prisma.merchant.create({
        data: {
          email,
          passwordHash: await bcrypt.hash('password', 12),
          name: 'Reject Test',
          status: 'pending',
        },
      });

      const res = await request(app.getHttpServer())
        .post(`/api/admin/merchants/${merchant.id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Invalid business documents' })
        .expect(200);

      expect(res.body.merchant.status).toBe('rejected');
      expect(res.body.reason).toBe('Invalid business documents');
    });
  });

  describe('GET /api/admin/stores', () => {
    it('should list all stores', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/stores')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
    });
  });

  describe('GET /api/admin/analytics', () => {
    it('should return platform analytics', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toHaveProperty('merchants');
      expect(res.body.data).toHaveProperty('stores');
      expect(res.body.data.merchants).toHaveProperty('total');
    });
  });

  describe('GET /api/admin/audit-log', () => {
    it('should return audit log entries', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/audit-log')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
    });
  });
});
