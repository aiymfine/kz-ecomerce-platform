import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new merchant', async () => {
      const uniqueEmail = `test-${Date.now()}@example.com`;
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: uniqueEmail,
          password: 'password123',
          name: 'Test Merchant',
          phone: '+77001234567',
        })
        .expect(201);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body).toHaveProperty('merchant');
      expect(res.body.merchant.email).toBe(uniqueEmail);
      expect(res.body.merchant).not.toHaveProperty('passwordHash');
    });

    it('should reject duplicate email', async () => {
      const email = `dup-${Date.now()}@example.com`;
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, password: 'password123', name: 'Test' });

      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, password: 'password123', name: 'Test' })
        .expect(409);

      expect(res.body.error).toContain('CONFLICT');
    });

    it('should reject short password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: `short-${Date.now()}@example.com`,
          password: 'short',
          name: 'Test',
        })
        .expect(400);

      expect(res.body.message).toContain('Validation failed');
    });

    it('should reject invalid email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          password: 'password123',
          name: 'Test',
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const email = `login-${Date.now()}@example.com`;
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, password: 'password123', name: 'Test' });

      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'password123' })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('should reject invalid password', async () => {
      const email = `wrongpw-${Date.now()}@example.com`;
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, password: 'password123', name: 'Test' });

      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'wrongpassword' })
        .expect(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token', async () => {
      const email = `refresh-${Date.now()}@example.com`;
      const regRes = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, password: 'password123', name: 'Test' });

      const res = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: regRes.body.refreshToken })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('should reject invalid refresh token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user profile', async () => {
      const email = `me-${Date.now()}@example.com`;
      const regRes = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, password: 'password123', name: 'Test' });

      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${regRes.body.accessToken}`)
        .expect(200);

      expect(res.body.email).toBe(email);
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const email = `logout-${Date.now()}@example.com`;
      const regRes = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, password: 'password123', name: 'Test' });

      const res = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${regRes.body.accessToken}`)
        .send({ refreshToken: regRes.body.refreshToken })
        .expect(200);
    });
  });

  describe('RBAC - 403 for wrong role', () => {
    it('should return 403 when merchant accesses admin endpoint', async () => {
      const email = `rbac-${Date.now()}@example.com`;
      const regRes = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, password: 'password123', name: 'Test' });

      const res = await request(app.getHttpServer())
        .get('/api/admin/merchants')
        .set('Authorization', `Bearer ${regRes.body.accessToken}`)
        .expect(403);
    });
  });
});
