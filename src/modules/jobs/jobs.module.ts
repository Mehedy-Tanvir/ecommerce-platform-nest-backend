import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { EmailProcessor } from './processors/email.processor';
import { InventoryProcessor } from './processors/inventory.processor';
import { CleanupProcessor } from './processors/cleanup.processor';
import { JobsSchedulerService } from './scheduler.service';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'email' },
      { name: 'inventory' },
      { name: 'cleanup' },
    ),
  ],
  providers: [
    EmailProcessor,
    InventoryProcessor,
    CleanupProcessor,
    JobsSchedulerService,
  ],
  exports: [BullModule],
})
export class JobsModule {}
