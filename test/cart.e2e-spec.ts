import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

jest.setTimeout(30000);

describe('Cart (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let productId: string;

  const testUser = {
    email: `cart-e2e-${Date.now()}@example.com`,
    password: 'TestPass123',
    firstName: 'Cart',
    lastName: 'E2E',
  };

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

    const category = await prisma.category.create({
      data: {
        name: 'Cart Test Category',
        slug: `cart-test-${Date.now()}`,
        isActive: true,
      },
    });

    const product = await prisma.product.create({
      data: {
        name: 'Cart Test Product',
        price: 19.99,
        stock: 50,
        sku: `CART-TEST-${Date.now()}`,
        isActive: true,
        categoryId: category.id,
      },
    });
    productId = product.id;

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(testUser)
      .expect(201);

    accessToken = res.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  const auth = () => ({ Authorization: `Bearer ${accessToken}` });

  describe('Cart lifecycle', () => {
    it('GET /api/v1/cart returns empty cart for new user', () => {
      return request(app.getHttpServer())
        .get('/api/v1/cart')
        .set(auth())
        .expect(200)
        .expect((res) => {
          expect(res.body.items).toHaveLength(0);
          expect(res.body.total).toBe(0);
        });
    });

    it('POST /api/v1/cart/items adds an item and returns the updated cart', () => {
      return request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set(auth())
        .send({ productId, quantity: 2 })
        .expect(201)
        .expect((res) => {
          expect(res.body.items).toHaveLength(1);
          expect(res.body.items[0].productId).toBe(productId);
          expect(res.body.items[0].quantity).toBe(2);
          expect(res.body.total).toBeCloseTo(39.98, 2);
        });
    });

    it('POST /api/v1/cart/items with same product increments quantity', () => {
      return request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set(auth())
        .send({ productId, quantity: 3 })
        .expect(201)
        .expect((res) => {
          expect(res.body.items).toHaveLength(1);
          expect(res.body.items[0].quantity).toBe(5);
          expect(res.body.total).toBeCloseTo(99.95, 2);
        });
    });

    it('PATCH /api/v1/cart/items/:id updates quantity', async () => {
      const cart = await request(app.getHttpServer())
        .get('/api/v1/cart')
        .set(auth())
        .expect(200);
      const itemId = cart.body.items[0].id;

      return request(app.getHttpServer())
        .patch(`/api/v1/cart/items/${itemId}`)
        .set(auth())
        .send({ quantity: 1 })
        .expect(200)
        .expect((res) => {
          expect(res.body.items[0].quantity).toBe(1);
          expect(res.body.total).toBeCloseTo(19.99, 2);
        });
    });

    it('DELETE /api/v1/cart/items/:id removes the item', async () => {
      const cart = await request(app.getHttpServer())
        .get('/api/v1/cart')
        .set(auth())
        .expect(200);
      const itemId = cart.body.items[0].id;

      await request(app.getHttpServer())
        .delete(`/api/v1/cart/items/${itemId}`)
        .set(auth())
        .expect(200);

      return request(app.getHttpServer())
        .get('/api/v1/cart')
        .set(auth())
        .expect(200)
        .expect((res) => {
          expect(res.body.items).toHaveLength(0);
        });
    });

    it('DELETE /api/v1/cart clears all items', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set(auth())
        .send({ productId, quantity: 1 })
        .expect(201);

      await request(app.getHttpServer())
        .delete('/api/v1/cart')
        .set(auth())
        .expect(200);

      return request(app.getHttpServer())
        .get('/api/v1/cart')
        .set(auth())
        .expect(200)
        .expect((res) => {
          expect(res.body.items).toHaveLength(0);
        });
    });
  });

  describe('Error cases', () => {
    it('returns 401 for unauthenticated request', () => {
      return request(app.getHttpServer()).get('/api/v1/cart').expect(401);
    });

    it('returns 404 for invalid product ID on add', () => {
      return request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set(auth())
        .send({ productId: '00000000-0000-4000-8000-000000000000' })
        .expect(404);
    });

    it('returns 404 for invalid cart item ID on remove', () => {
      return request(app.getHttpServer())
        .delete('/api/v1/cart/items/00000000-0000-4000-8000-000000000000')
        .set(auth())
        .expect(404);
    });

    it('returns 404 for invalid cart item ID on update', () => {
      return request(app.getHttpServer())
        .patch('/api/v1/cart/items/00000000-0000-4000-8000-000000000000')
        .set(auth())
        .send({ quantity: 2 })
        .expect(404);
    });

    it('returns 400 for negative quantity on update', () => {
      return request(app.getHttpServer())
        .patch('/api/v1/cart/items/00000000-0000-4000-8000-000000000000')
        .set(auth())
        .send({ quantity: -1 })
        .expect(400);
    });
  });
});
