import { createTestApp } from './test-setup';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import * as bcrypt from 'bcryptjs';

describe('Admin RBAC (e2e)', () => {
  let app: any;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let adminToken: string;
  let merchantToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);

    // Create admin
    const adminHash = await bcrypt.hash('AdminPass123!', 12);
    const admin = await prisma.platformAdmin.create({
      data: { email: 'test-admin@example.com', passwordHash: adminHash, name: 'Test Admin', role: 'super_admin' },
    });
    adminToken = jwtService.sign({ sub: admin.id, email: admin.email, role: 'super_admin' });

    // Create merchant
    const mHash = await bcrypt.hash('MerchantPass123!', 12);
    const merchant = await prisma.merchant.create({
      data: { email: 'test-rbac@example.com', passwordHash: mHash, name: 'Test', status: 'approved', isActive: true },
    });
    merchantToken = jwtService.sign({ sub: merchant.id, email: merchant.email, role: 'merchant' });
  });

  afterAll(async () => {
    try {
      await prisma.platformAdmin.deleteMany({ where: { email: 'test-admin@example.com' } });
      await prisma.merchant.deleteMany({ where: { email: 'test-rbac@example.com' } });
      await prisma.$disconnect();
      await app.close();
    } catch {}
  });

  it('GET /api/admin/merchants — admin can access', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/merchants')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('GET /api/admin/merchants — merchant gets 403', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/merchants')
      .set('Authorization', `Bearer ${merchantToken}`);
    expect(res.status).toBe(403);
  });

  it('GET /api/admin/merchants — no token gets rejected (401 or 403)', async () => {
    const res = await request(app.getHttpServer()).get('/api/admin/merchants');
    expect([401, 403]).toContain(res.status);
  });

  it('GET /api/admin/audit-log — admin can access', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/audit-log')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('GET /api/admin/audit-log — merchant gets 403', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/audit-log')
      .set('Authorization', `Bearer ${merchantToken}`);
    expect(res.status).toBe(403);
  });
});
