import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [BullModule],
  providers: [],
  exports: [BullModule],
})
export class JobsModule {}
