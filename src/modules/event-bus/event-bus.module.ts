import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { OrderListener } from './listeners/order.listener';
import { PaymentListener } from './listeners/payment.listener';
import { UserListener } from './listeners/user.listener';
import { JobsModule } from '../jobs/jobs.module';

@Global()
@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
    }),
    JobsModule,
  ],
  providers: [OrderListener, PaymentListener, UserListener],
  exports: [EventEmitterModule],
})
export class EventBusModule {}
