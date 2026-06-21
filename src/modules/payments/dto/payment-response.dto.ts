import { ApiProperty } from '@nestjs/swagger';

export class PaymentResponseDto {
  @ApiProperty({
    example: '11613fg16f5g14351g3f',
  })
  id!: string;

  @ApiProperty({
    example: '11613fg16f5g14351g3f',
  })
  orderId!: string;

  @ApiProperty({
    example: 99.99,
  })
  amount!: number;

  @ApiProperty({
    example: 'user-1g3f',
  })
  userId!: string;

  @ApiProperty({
    example: 'USD',
  })
  currency!: string;

  @ApiProperty({
    example: 'COMPLETED',
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'],
  })
  status!: string;

  @ApiProperty({
    example: 'STRIPE',
    nullable: true,
  })
  paymentMethod!: string | null;

  @ApiProperty({
    example: 'pi_123456789',
    nullable: true,
  })
  transactionId!: string | null;

  @ApiProperty({})
  createdAt!: Date;

  @ApiProperty({})
  updatedAt!: Date;
}

export class CreatePaymentIntentResponse {
  @ApiProperty({
    example: 'pi_123456789',
    description: 'Stripe client secret for payment confirmation',
  })
  clientSecret!: string;

  @ApiProperty({
    example: '2134567-23146567-425324125',
    description: 'Payment id in database',
  })
  paymentId!: string;
}

export class PaymentApiResponseDto {
  @ApiProperty({
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    type: CreatePaymentIntentResponse,
  })
  data!: PaymentResponseDto;
}
