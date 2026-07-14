import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { CartResponseDto } from './dto/cart-response.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

type CartWithItems = Prisma.CartGetPayload<{
  include: { cartItems: { include: { product: true } } };
}>;

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async getOrCreateCart(userId: string): Promise<CartWithItems> {
    const existing = await this.prisma.cart.findFirst({
      where: { userId, checkedOut: false },
      include: { cartItems: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.cart.create({
      data: { userId },
      include: { cartItems: { include: { product: true } } },
    });
  }

  private mapToResponseDto(cart: CartWithItems): CartResponseDto {
    const items = cart.cartItems.map((item) => {
      const price = Number(item.product.price);
      const subtotal = price * item.quantity;
      return {
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        price,
        quantity: item.quantity,
        subtotal,
      };
    });

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);

    return {
      id: cart.id,
      userId: cart.userId,
      items,
      total,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }

  async getCart(userId: string): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(userId);
    return this.mapToResponseDto(cart);
  }

  async addItem(userId: string, dto: AddCartItemDto): Promise<CartResponseDto> {
    const quantity = dto.quantity ?? 1;
    const cart = await this.getOrCreateCart(userId);

    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException(
        `Product with ID "${dto.productId}" not found`,
      );
    }

    if (!product.isActive) {
      throw new BadRequestException(
        `Product with ID "${dto.productId}" is not available`,
      );
    }

    if (product.stock < quantity) {
      this.logger.warn(
        `Low stock for product "${product.name}": requested ${quantity}, available ${product.stock}`,
      );
    }

    const existingItem = cart.cartItems.find(
      (item) => item.productId === dto.productId,
    );

    if (existingItem) {
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          quantity,
        },
      });
    }

    return this.getCart(userId);
  }

  async updateItemQuantity(
    userId: string,
    itemId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    const cart = await this.prisma.cart.findFirst({
      where: { userId, checkedOut: false },
      include: { cartItems: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const item = cart.cartItems.find((i) => i.id === itemId);

    if (!item) {
      throw new NotFoundException(
        `Cart item with ID "${itemId}" not found in your cart`,
      );
    }

    if (item.cartId !== cart.id) {
      throw new ForbiddenException(
        `Cart item with ID "${itemId}" does not belong to you`,
      );
    }

    if (dto.quantity <= 0) {
      await this.prisma.cartItem.delete({
        where: { id: itemId },
      });
      return this.getCart(userId);
    }

    const product = await this.prisma.product.findUnique({
      where: { id: item.productId },
    });

    if (product && product.stock < dto.quantity) {
      this.logger.warn(
        `Low stock for product "${product.name}": requested ${dto.quantity}, available ${product.stock}`,
      );
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
    });

    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string): Promise<CartResponseDto> {
    const cart = await this.prisma.cart.findFirst({
      where: { userId, checkedOut: false },
      include: { cartItems: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const item = cart.cartItems.find((i) => i.id === itemId);

    if (!item) {
      throw new NotFoundException(
        `Cart item with ID "${itemId}" not found in your cart`,
      );
    }

    if (item.cartId !== cart.id) {
      throw new ForbiddenException(
        `Cart item with ID "${itemId}" does not belong to you`,
      );
    }

    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    return this.getCart(userId);
  }

  async clearCart(userId: string): Promise<CartResponseDto> {
    const cart = await this.prisma.cart.findFirst({
      where: { userId, checkedOut: false },
      orderBy: { createdAt: 'desc' },
    });

    if (cart) {
      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    return this.getCart(userId);
  }
}
