import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productService: ProductsService) {}

  //   create a new product
  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new product admin only' })
  @ApiBody({
    type: CreateProductDto,
  })
  createProduct(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }
}
