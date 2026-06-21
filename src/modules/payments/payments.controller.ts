import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiTags('Payments')
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post("create-intent")
  @ApiOperation({
    summary: "create payment intent",
    description: 'Create a payment intent for an order'
  })
  @ApiCreatedResponse({
    description: "Payment intent created successfully"
    type: CreatePaymentIntentApiResponseDto
  })
}
