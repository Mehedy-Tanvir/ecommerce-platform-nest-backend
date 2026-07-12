import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

jest.setTimeout(30000);

describe('E-Commerce API (e2e)', () => {
  let app: INestApplication;

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

    const prisma = app.get(PrismaService);
    await prisma.cleanDatabase();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('App', () => {
    it('GET /api/v1 returns 404 (no root route under prefix)', () => {
      return request(app.getHttpServer()).get('/').expect(404);
    });
  });

  describe('Auth', () => {
    const testUser = {
      email: 'e2e@example.com',
      password: 'TestPass123',
      firstName: 'E2E',
      lastName: 'Test',
    };

    let accessToken: string;
    let refreshToken: string;

    it('POST /api/v1/auth/register should create a user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.refreshToken).toBeDefined();
          expect(res.body.user.email).toBe(testUser.email);
          accessToken = res.body.accessToken;
          refreshToken = res.body.refreshToken;
        });
    });

    it('POST /api/v1/auth/register should reject duplicate email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(409);
    });

    it('POST /api/v1/auth/login should authenticate', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200)
        .expect((res) => {
          expect(res.body.accessToken).toBeDefined();
          accessToken = res.body.accessToken;
          refreshToken = res.body.refreshToken;
        });
    });

    it('POST /api/v1/auth/login should reject wrong password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: 'WrongPass123' })
        .expect(401);
    });

    it('POST /api/v1/auth/refresh should issue new tokens', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.accessToken).toBeDefined();
          accessToken = res.body.accessToken;
          refreshToken = res.body.refreshToken;
        });
    });

    it('GET /api/v1/users/me should return logged-in user', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe(testUser.email);
        });
    });
  });

  describe('Products (public)', () => {
    it('GET /api/v1/products should return paginated results', () => {
      return request(app.getHttpServer())
        .get('/api/v1/products')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
          expect(res.body.meta).toBeDefined();
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('Categories (public)', () => {
    it('GET /api/v1/categories should return paginated results', () => {
      return request(app.getHttpServer())
        .get('/api/v1/categories')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('Validation', () => {
    it('should reject invalid email on register', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'not-an-email', password: 'TestPass123' })
        .expect(400);
    });

    it('should reject requests with unknown fields', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'TestPass123',
          unknownField: 'should fail',
        })
        .expect(400);
    });
  });
});
