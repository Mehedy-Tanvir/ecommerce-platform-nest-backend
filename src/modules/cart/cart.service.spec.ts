import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { createMockPrisma } from 'src/common/test/test-utils';
import type { DeepMockProxy } from 'jest-mock-extended';

type CartWithItems = {
  id: string;
  userId: string;
  checkedOut: boolean;
  createdAt: Date;
  updatedAt: Date;
  cartItems: {
    id: string;
    cartId: string;
    productId: string;
    quantity: number;
    product: { id: string; name: string; price: number; isActive: boolean };
  }[];
};

const now = new Date();

function makeProduct(overrides: Partial<any> = {}) {
  return {
    id: 'product-1',
    name: 'Test Product',
    price: 10.5,
    isActive: true,
    stock: 100,
    ...overrides,
  };
}

function makeCart(
  userId: string,
  items: CartWithItems['cartItems'] = [],
  overrides: Partial<CartWithItems> = {},
): CartWithItems {
  return {
    id: 'cart-1',
    userId,
    checkedOut: false,
    createdAt: now,
    updatedAt: now,
    cartItems: items,
    ...overrides,
  };
}

function makeCartItem(
  productId: string,
  quantity: number,
  overrides: Partial<any> = {},
) {
  return {
    id: 'item-1',
    cartId: 'cart-1',
    productId,
    quantity,
    product: makeProduct({ id: productId }),
    ...overrides,
  };
}

describe('CartService', () => {
  let service: CartService;
  let prisma: DeepMockProxy<PrismaService>;

  const userId = 'user-1';

  beforeEach(async () => {
    const mockPrisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    prisma = mockPrisma as unknown as DeepMockProxy<PrismaService>;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getOrCreateCart', () => {
    it('should return existing cart when one exists', async () => {
      const existingCart = makeCart(userId, [makeCartItem('product-1', 2)]);
      prisma.cart.findFirst.mockResolvedValue(existingCart);

      const result = await (service as any).getOrCreateCart(userId);

      expect(result).toEqual(existingCart);
      expect(prisma.cart.findFirst).toHaveBeenCalledTimes(1);
      expect(prisma.cart.create).not.toHaveBeenCalled();
    });

    it('should create a new cart when none exists', async () => {
      prisma.cart.findFirst.mockResolvedValue(null);
      const newCart = makeCart(userId);
      prisma.cart.create.mockResolvedValue(newCart);

      const result = await (service as any).getOrCreateCart(userId);

      expect(result).toEqual(newCart);
      expect(prisma.cart.create).toHaveBeenCalledWith({
        data: { userId },
        include: { cartItems: { include: { product: true } } },
      });
    });
  });

  describe('getCart', () => {
    it('should return a CartResponseDto with computed total', async () => {
      const cart = makeCart(userId, [
        makeCartItem('product-1', 2),
        makeCartItem('product-2', 1, {
          id: 'item-2',
          product: makeProduct({ id: 'product-2', price: 5 }),
        }),
      ]);
      prisma.cart.findFirst.mockResolvedValue(cart);

      const result = await service.getCart(userId);

      expect(result.items).toHaveLength(2);
      // 10.5 * 2 + 5 * 1 = 26
      expect(result.total).toBe(26);
    });

    it('should return 0 total for an empty cart', async () => {
      const cart = makeCart(userId, []);
      prisma.cart.findFirst.mockResolvedValue(cart);

      const result = await service.getCart(userId);

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('addItem', () => {
    const baseDto: AddCartItemDto = { productId: 'product-1' };

    it('should create a new cart item when product not in cart', async () => {
      const cart = makeCart(userId, []);
      prisma.cart.findFirst.mockResolvedValue(cart);
      prisma.product.findUnique.mockResolvedValue(makeProduct() as any);
      prisma.cartItem.create.mockResolvedValue({} as any);

      await service.addItem(userId, baseDto);

      expect(prisma.cartItem.create).toHaveBeenCalledWith({
        data: { cartId: 'cart-1', productId: 'product-1', quantity: 1 },
      });
    });

    it('should increment quantity when product already in cart', async () => {
      const cart = makeCart(userId, [makeCartItem('product-1', 2)]);
      prisma.cart.findFirst.mockResolvedValue(cart);
      prisma.product.findUnique.mockResolvedValue(makeProduct() as any);
      prisma.cartItem.update.mockResolvedValue({} as any);

      await service.addItem(userId, baseDto);

      expect(prisma.cartItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { quantity: 3 },
      });
      expect(prisma.cartItem.create).not.toHaveBeenCalled();
    });

    it('should respect the provided quantity when creating', async () => {
      const cart = makeCart(userId, []);
      prisma.cart.findFirst.mockResolvedValue(cart);
      prisma.product.findUnique.mockResolvedValue(makeProduct() as any);
      prisma.cartItem.create.mockResolvedValue({} as any);

      await service.addItem(userId, { productId: 'product-1', quantity: 5 });

      expect(prisma.cartItem.create).toHaveBeenCalledWith({
        data: { cartId: 'cart-1', productId: 'product-1', quantity: 5 },
      });
    });

    it('should throw NotFoundException for non-existent product', async () => {
      const cart = makeCart(userId, []);
      prisma.cart.findFirst.mockResolvedValue(cart);
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.addItem(userId, baseDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.cartItem.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for inactive product', async () => {
      const cart = makeCart(userId, []);
      prisma.cart.findFirst.mockResolvedValue(cart);
      prisma.product.findUnique.mockResolvedValue(
        makeProduct({ isActive: false }) as any,
      );

      await expect(service.addItem(userId, baseDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.cartItem.create).not.toHaveBeenCalled();
    });
  });

  describe('updateItemQuantity', () => {
    const dto: UpdateCartItemDto = { quantity: 5 };

    it('should update quantity successfully', async () => {
      const cart = makeCart(userId, [makeCartItem('product-1', 1)]);
      prisma.cart.findFirst.mockResolvedValue(cart);
      prisma.product.findUnique.mockResolvedValue(makeProduct() as any);
      prisma.cartItem.update.mockResolvedValue({} as any);

      await service.updateItemQuantity(userId, 'item-1', dto);

      expect(prisma.cartItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { quantity: 5 },
      });
    });

    it('should delete the item when quantity is 0 or less', async () => {
      const cart = makeCart(userId, [makeCartItem('product-1', 1)]);
      prisma.cart.findFirst.mockResolvedValue(cart);
      prisma.cartItem.delete.mockResolvedValue({} as any);

      await service.updateItemQuantity(userId, 'item-1', { quantity: 0 });

      expect(prisma.cartItem.delete).toHaveBeenCalledWith({
        where: { id: 'item-1' },
      });
      expect(prisma.cartItem.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when cart not found', async () => {
      prisma.cart.findFirst.mockResolvedValue(null);

      await expect(
        service.updateItemQuantity(userId, 'item-1', dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when item not in cart', async () => {
      const cart = makeCart(userId, []);
      prisma.cart.findFirst.mockResolvedValue(cart);

      await expect(
        service.updateItemQuantity(userId, 'item-1', dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when item belongs to a different cart', async () => {
      const cart = makeCart(userId, [
        makeCartItem('product-1', 1, { cartId: 'other-cart' }),
      ]);
      prisma.cart.findFirst.mockResolvedValue(cart);

      await expect(
        service.updateItemQuantity(userId, 'item-1', dto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeItem', () => {
    it('should remove the item successfully', async () => {
      const cart = makeCart(userId, [makeCartItem('product-1', 1)]);
      prisma.cart.findFirst.mockResolvedValue(cart);
      prisma.cartItem.delete.mockResolvedValue({} as any);

      await service.removeItem(userId, 'item-1');

      expect(prisma.cartItem.delete).toHaveBeenCalledWith({
        where: { id: 'item-1' },
      });
    });

    it('should throw NotFoundException when cart not found', async () => {
      prisma.cart.findFirst.mockResolvedValue(null);

      await expect(service.removeItem(userId, 'item-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when item not in cart', async () => {
      const cart = makeCart(userId, []);
      prisma.cart.findFirst.mockResolvedValue(cart);

      await expect(service.removeItem(userId, 'item-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when item belongs to a different cart', async () => {
      const cart = makeCart(userId, [
        makeCartItem('product-1', 1, { cartId: 'other-cart' }),
      ]);
      prisma.cart.findFirst.mockResolvedValue(cart);

      await expect(service.removeItem(userId, 'item-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('clearCart', () => {
    it('should delete all items from the cart', async () => {
      const cartWithItem = makeCart(userId, [makeCartItem('product-1', 1)]);
      const emptyCart = makeCart(userId, []);
      prisma.cart.findFirst.mockResolvedValueOnce(cartWithItem);
      prisma.cart.findFirst.mockResolvedValue(emptyCart);
      prisma.cartItem.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.clearCart(userId);

      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cartId: 'cart-1' },
      });
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should not call deleteMany when no cart exists', async () => {
      const emptyCart = makeCart(userId, []);
      prisma.cart.findFirst.mockResolvedValue(null);
      prisma.cart.create.mockResolvedValue(emptyCart);

      const result = await service.clearCart(userId);

      expect(prisma.cartItem.deleteMany).not.toHaveBeenCalled();
      expect(result.items).toHaveLength(0);
    });
  });
});
