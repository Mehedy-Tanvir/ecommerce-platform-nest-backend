import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { EVENTS } from '../constants';
import { OrderPlacedEvent, OrderCancelledEvent } from '../events';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OrderListener {
  private readonly logger = new Logger(OrderListener.name);

  constructor(
    @InjectQueue('email') private readonly emailQueue: Queue,
    @InjectQueue('inventory') private readonly inventoryQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent(EVENTS.ORDER_PLACED)
  async handleOrderPlaced(event: OrderPlacedEvent): Promise<void> {
    this.logger.log(
      `OrderPlacedEvent { orderId: ${event.orderId}, userId: ${event.userId}, totalAmount: ${event.totalAmount} }`,
    );

    const order = await this.prisma.order.findUnique({
      where: { id: event.orderId },
      include: {
        user: true,
        orderItems: true,
      },
    });

    if (!order) {
      this.logger.warn(
        `Order ${event.orderId} not found; skipping email/inventory jobs`,
      );
      return;
    }

    const items = order.orderItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    const emailJob = await this.emailQueue.add(
      'send-order-confirmation',
      {
        orderId: order.id,
        email: order.user.email,
        totalAmount: Number(order.totalAmount),
      },
      {
        removeOnComplete: true,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );
    this.logger.log(
      `Added email:send-order-confirmation job (${emailJob.id}) to queue`,
    );

    const inventoryJob = await this.inventoryQueue.add(
      'reserve-stock',
      { orderId: order.id, items },
      {
        priority: 1,
        removeOnComplete: true,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );
    this.logger.log(
      `Added inventory:reserve-stock job (${inventoryJob.id}) to queue`,
    );
  }

  @OnEvent(EVENTS.ORDER_CANCELLED)
  async handleOrderCancelled(event: OrderCancelledEvent): Promise<void> {
    this.logger.log(
      `OrderCancelledEvent { orderId: ${event.orderId}, userId: ${event.userId} }`,
    );

    const order = await this.prisma.order.findUnique({
      where: { id: event.orderId },
      include: { orderItems: true },
    });

    if (!order) {
      this.logger.warn(
        `Order ${event.orderId} not found; skipping inventory release job`,
      );
      return;
    }

    const items = order.orderItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    const inventoryJob = await this.inventoryQueue.add(
      'release-stock',
      { orderId: order.id, items },
      {
        priority: 1,
        removeOnComplete: true,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );
    this.logger.log(
      `Added inventory:release-stock job (${inventoryJob.id}) to queue`,
    );
  }
}
