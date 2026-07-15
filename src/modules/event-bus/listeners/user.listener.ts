import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EVENTS } from '../constants';
import { UserRegisteredEvent } from '../events';

@Injectable()
export class UserListener {
  private readonly logger = new Logger(UserListener.name);

  @OnEvent(EVENTS.USER_REGISTERED)
  handleUserRegistered(event: UserRegisteredEvent): void {
    this.logger.log(
      `UserRegisteredEvent { userId: ${event.userId}, email: ${event.email} }`,
    );
    // Future: send welcome email
  }
}
