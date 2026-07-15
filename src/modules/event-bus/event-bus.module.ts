import { Global, Module } from '@nestjs/common';
import { EventEmitterModule, EventEmitter2 } from '@nestjs/event-emitter';
import { OrderListener } from './listeners/order.listener';
import { PaymentListener } from './listeners/payment.listener';
import { UserListener } from './listeners/user.listener';

@Global()
@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
    }),
  ],
  providers: [OrderListener, PaymentListener, UserListener],
  exports: [EventEmitterModule],
})
export class EventBusModule {}
