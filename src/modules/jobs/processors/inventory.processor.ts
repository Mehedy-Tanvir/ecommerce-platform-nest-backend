import { Logger } from '@nestjs/common';
import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { PrismaService } from 'src/prisma/prisma.service';

export interface OrderItemStock {
  productId: string;
  quantity: number;
}

export interface ReserveStockJob {
  orderId: string;
  items: OrderItemStock[];
}

export interface ReleaseStockJob {
  orderId: string;
  items: OrderItemStock[];
}

@Processor('inventory')
export class InventoryProcessor {
  private readonly logger = new Logger(InventoryProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  @Process({ name: 'reserve-stock', concurrency: 3 })
  async reserveStock(job: Job<ReserveStockJob>) {
    const { orderId, items } = job.data;
    this.logger.log(
      `Reserving stock for order ${orderId} (${items.length} items)`,
    );

    // Decrement stock for each product atomically.
    // Use a transaction so concurrent reservations don't oversell.
    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        }),
      ),
    );

    this.logger.log(`Reserved stock for order ${orderId}`);
    return { orderId, reserved: items.length };
  }

  @Process('release-stock')
  async releaseStock(job: Job<ReleaseStockJob>) {
    const { orderId, items } = job.data;
    this.logger.log(
      `Releasing stock for cancelled order ${orderId} (${items.length} items)`,
    );

    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        }),
      ),
    );

    this.logger.log(`Released stock for order ${orderId}`);
    return { orderId, released: items.length };
  }
}
