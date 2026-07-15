import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { EVENTS } from '../constants';
import { PaymentCompletedEvent } from '../events';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PaymentListener {
  private readonly logger = new Logger(PaymentListener.name);

  constructor(
    @InjectQueue('email') private readonly emailQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent(EVENTS.PAYMENT_COMPLETED)
  async handlePaymentCompleted(event: PaymentCompletedEvent): Promise<void> {
    this.logger.log(
      `PaymentCompletedEvent { paymentId: ${event.paymentId}, orderId: ${event.orderId} }`,
    );

    const order = await this.prisma.order.findUnique({
      where: { id: event.orderId },
      include: { user: true },
    });

    if (!order) {
      this.logger.warn(
        `Order ${event.orderId} not found; skipping payment confirmation email`,
      );
      return;
    }

    const emailJob = await this.emailQueue.add(
      'send-order-confirmation',
      {
        orderId: order.id,
        email: order.user.email,
        totalAmount: Number(order.totalAmount),
        paymentStatus: 'completed',
      },
      {
        removeOnComplete: true,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );
    this.logger.log(
      `Added email:send-order-confirmation (payment) job (${emailJob.id}) to queue`,
    );
  }
}
