import { Logger } from '@nestjs/common';
import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { PrismaService } from 'src/prisma/prisma.service';

export interface DeleteExpiredCartsJob {
  olderThanDays?: number;
}

export interface CleanOldLogsJob {
  olderThanDays?: number;
}

@Processor('cleanup')
export class CleanupProcessor {
  private readonly logger = new Logger(CleanupProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  @Process('delete-expired-carts')
  async deleteExpiredCarts(job: Job<DeleteExpiredCartsJob>) {
    const olderThanDays = job.data?.olderThanDays ?? 7;
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

    this.logger.log(`Deleting carts older than ${olderThanDays} days`);

    const result = await this.prisma.cart.deleteMany({
      where: {
        createdAt: { lt: cutoff },
        checkedOut: false,
        orders: { none: {} },
      },
    });

    this.logger.log(`Deleted ${result.count} expired carts`);
    return { deleted: result.count };
  }

  @Process('clean-old-logs')
  cleanOldLogs(job: Job<CleanOldLogsJob>) {
    const olderThanDays = job.data?.olderThanDays ?? 90;
    this.logger.log(`Cleaning audit logs older than ${olderThanDays} days`);

    // TODO: once an audit log model exists, delete logs older than the cutoff.
    // const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    // const result = await this.prisma.auditLog.deleteMany({
    //   where: { createdAt: { lt: cutoff } },
    // });
    // this.logger.log(`Deleted ${result.count} old audit logs`);
    return { deleted: 0, status: 'not-yet-implemented' };
  }
}
