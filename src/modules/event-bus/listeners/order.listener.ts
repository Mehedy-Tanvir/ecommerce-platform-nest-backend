import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EVENTS } from '../constants';
import { OrderPlacedEvent, OrderCancelledEvent } from '../events';

@Injectable()
export class OrderListener {
  private readonly logger = new Logger(OrderListener.name);

  @OnEvent(EVENTS.ORDER_PLACED)
  handleOrderPlaced(event: OrderPlacedEvent): void {
    this.logger.log(
      `OrderPlacedEvent { orderId: ${event.orderId}, userId: ${event.userId}, totalAmount: ${event.totalAmount} }`,
    );
    // Future: send email confirmation, trigger inventory update
  }

  @OnEvent(EVENTS.ORDER_CANCELLED)
  handleOrderCancelled(event: OrderCancelledEvent): void {
    this.logger.log(
      `OrderCancelledEvent { orderId: ${event.orderId}, userId: ${event.userId} }`,
    );
    // Future: release inventory, process refund
  }
}
