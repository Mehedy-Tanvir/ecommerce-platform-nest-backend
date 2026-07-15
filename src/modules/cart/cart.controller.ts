import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { CartResponseDto } from './dto/cart-response.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@ApiTags('Cart')
@ApiBearerAuth('JWT-auth')
@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get the current user’s cart' })
  @ApiOkResponse({
    description: 'The current user’s cart',
    type: CartResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getCart(@GetUser() user: { id: string }) {
    return this.cartService.getCart(user.id);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add an item to the cart' })
  @ApiCreatedResponse({
    description: 'Item added to the cart',
    type: CartResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async addItem(@GetUser() user: { id: string }, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(user.id, dto);
  }

  @Patch('items/:itemId')
  @ApiOperation({ summary: 'Update the quantity of a cart item' })
  @ApiParam({
    name: 'itemId',
    description: 'The ID of the cart item',
    type: String,
  })
  @ApiOkResponse({
    description: 'Cart item quantity updated',
    type: CartResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Cart item not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async updateItemQuantity(
    @GetUser() user: { id: string },
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItemQuantity(user.id, itemId, dto);
  }

  @Delete('items/:itemId')
  @ApiOperation({ summary: 'Remove an item from the cart' })
  @ApiParam({
    name: 'itemId',
    description: 'The ID of the cart item',
    type: String,
  })
  @ApiOkResponse({
    description: 'Cart item removed',
    type: CartResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Cart item not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async removeItem(
    @GetUser() user: { id: string },
    @Param('itemId') itemId: string,
  ) {
    return this.cartService.removeItem(user.id, itemId);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear the entire cart' })
  @ApiOkResponse({
    description: 'Cart cleared',
    type: CartResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async clearCart(@GetUser() user: { id: string }) {
    return this.cartService.clearCart(user.id);
  }
}
