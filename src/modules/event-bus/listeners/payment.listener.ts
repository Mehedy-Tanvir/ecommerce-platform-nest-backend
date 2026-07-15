import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EVENTS } from '../constants';
import { PaymentCompletedEvent } from '../events';

@Injectable()
export class PaymentListener {
  private readonly logger = new Logger(PaymentListener.name);

  @OnEvent(EVENTS.PAYMENT_COMPLETED)
  handlePaymentCompleted(event: PaymentCompletedEvent): void {
    this.logger.log(
      `PaymentCompletedEvent { paymentId: ${event.paymentId}, orderId: ${event.orderId} }`,
    );
    // Future: update order status, trigger shipping
  }
}
