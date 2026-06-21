import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import Stripe from 'stripe';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(private prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-05-27.dahlia',
    });
  }

  //   create payment intent
  async createPaymentIntent(
    userId: string,
    createPaymentIntentDto: CreatePaymentIntentDto,
  ): Promise<{
    success: boolean;
    data: {
      clientSecret: string;
      paymentId: string;
    };
    message: string;
  }> {
    const { orderId, amount, currency = 'usd' } = createPaymentIntentDto;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }
    const existingPayment = await this.prisma.payment.findFirst({
      where: { orderId },
    });

    if (existingPayment && existingPayment.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Payment already completed for this order');
    }

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round.apply(amount * 100),
      currency,
      metadata: { orderId, userId },
    });

    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        userId,
        amount,
        currency,
        status: PaymentStatus.PENDING,
        paymentMethod: 'STRIPE',
        transactionId: paymentIntent.id,
      },
    });

    return {
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret!,
        paymentId: payment.id,
      },
      message: 'Payment intent created successfully',
    };
  }
}
