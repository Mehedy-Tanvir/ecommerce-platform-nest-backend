import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

@Injectable()
export class JobsSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(JobsSchedulerService.name);

  constructor(@InjectQueue('cleanup') private readonly cleanupQueue: Queue) {}

  async onModuleInit(): Promise<void> {
    const repeatableJobs = await this.cleanupQueue.getRepeatableJobs();
    const exists = repeatableJobs.some(
      (job) => job.name === 'delete-expired-carts',
    );

    if (exists) {
      this.logger.log('Daily cleanup job already scheduled; skipping');
      return;
    }

    await this.cleanupQueue.add(
      'delete-expired-carts',
      { olderThanDays: 7 },
      {
        repeat: { cron: '0 3 * * *' },
        removeOnComplete: true,
      },
    );

    this.logger.log(
      'Scheduled daily cleanup job (delete-expired-carts) at 03:00',
    );
  }
}
