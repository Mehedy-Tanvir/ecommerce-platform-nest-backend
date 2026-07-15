import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role } from '@prisma/client';

jest.setTimeout(30000);

describe('Admin Audit Logs (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const adminCreds = {
    email: 'audit-admin@example.com',
    password: 'Admin123!',
  };
  const userCreds = {
    email: 'audit-user@example.com',
    password: 'Admin123!',
  };

  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);
    await prisma.cleanDatabase();

    const hashed = await bcrypt.hash(adminCreds.password, 12);

    const admin = await prisma.user.create({
      data: {
        email: adminCreds.email,
        password: hashed,
        firstName: 'Audit',
        lastName: 'Admin',
        role: Role.ADMIN,
      },
    });

    await prisma.user.create({
      data: {
        email: userCreds.email,
        password: hashed,
        firstName: 'Audit',
        lastName: 'User',
        role: Role.USER,
      },
    });

    await prisma.auditLog.createMany({
      data: [
        {
          action: 'ORDER_CREATED',
          entity: 'order',
          entityId: 'order-1',
          userId: admin.id,
        },
        {
          action: 'USER_LOGIN',
          entity: 'user',
          entityId: admin.id,
          userId: admin.id,
        },
        {
          action: 'PRODUCT_CREATED',
          entity: 'product',
          entityId: 'product-1',
          userId: admin.id,
        },
      ],
    });

    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send(adminCreds)
      .expect(200);
    adminToken = adminLogin.body.accessToken;

    const userLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send(userCreds)
      .expect(200);
    userToken = userLogin.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('RBAC', () => {
    it('returns 401 for unauthenticated requests', () => {
      return request(app.getHttpServer())
        .get('/api/v1/admin/audit-logs')
        .expect(401);
    });

    it('returns 403 for non-admin users', () => {
      return request(app.getHttpServer())
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('Pagination & filters', () => {
    it('returns paginated results for admin', () => {
      return request(app.getHttpServer())
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.total).toBe(3);
          expect(res.body.page).toBe(1);
          expect(res.body.limit).toBe(20);
          expect(res.body.totalPages).toBe(1);
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBe(3);
        });
    });

    it('applies default pagination (page=1, limit=20)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.page).toBe(1);
          expect(res.body.limit).toBe(20);
        });
    });

    it('enforces max limit of 100', () => {
      return request(app.getHttpServer())
        .get('/api/v1/admin/audit-logs?limit=500')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('filters by action', () => {
      return request(app.getHttpServer())
        .get('/api/v1/admin/audit-logs?action=ORDER_CREATED')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.total).toBe(1);
          expect(res.body.data[0].action).toBe('ORDER_CREATED');
        });
    });

    it('filters by entity', () => {
      return request(app.getHttpServer())
        .get('/api/v1/admin/audit-logs?entity=product')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.total).toBe(1);
          expect(res.body.data[0].entity).toBe('product');
        });
    });

    it('returns empty result for non-matching filter', () => {
      return request(app.getHttpServer())
        .get('/api/v1/admin/audit-logs?action=NON_EXISTENT')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.total).toBe(0);
          expect(res.body.data.length).toBe(0);
        });
    });
  });
});
