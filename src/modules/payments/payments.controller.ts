import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentApiResponseDto, PaymentApiResponseDto } from './dto/payment-response.dto';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';

@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiTags('Payments')
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-intent')
  @ApiOperation({
    summary: 'create payment intent',
    description: 'Create a payment intent for an order',
  })
  @ApiCreatedResponse({
    description: 'Payment intent created successfully',
    type: CreatePaymentIntentApiResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid data or order not found',
  })
  async createPaymentIntent(
    @Body() createPaymentIntentDto: CreatePaymentIntentDto,
    @GetUser('id') userId: string,
  ): Promise<CreatePaymentIntentApiResponseDto> {
    return await this.paymentsService.createPaymentIntent(
      userId,
      createPaymentIntentDto,
    );
  }


  @Post("confirm")
  @ApiOperation({
    summary: "Confirm payment",
    description: "Confirm a payment intent for an order"
  })
  @ApiResponse({
    status: 200,
    description: "Payment confirmed successfully",
    type: PaymentApiResponseDto
  })
  @ApiBadRequestResponse({
    description: "Payment not found or already completed"
  })
}
