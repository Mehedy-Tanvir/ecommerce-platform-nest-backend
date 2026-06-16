import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { OrdersService } from './orders.service';
import { ModerateThrottle } from 'src/common/decorators/custom-throttler.decorator';
import { CreateOrderDto } from './dto/create-order.dto';

@ApiTags('Orders')
@ApiBearerAuth('JWT-auth')
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly orderService: OrdersService) {}

//   Create orders
@Post()
@ModerateThrottle()
@ApiOperation({
    summary: "Create a new order"
})
@ApiBody({
    type: CreateOrderDto
})
}
