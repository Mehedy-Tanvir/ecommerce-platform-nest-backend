import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { EVENTS } from '../constants';
import { UserRegisteredEvent } from '../events';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserListener {
  private readonly logger = new Logger(UserListener.name);

  constructor(
    @InjectQueue('email') private readonly emailQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent(EVENTS.USER_REGISTERED)
  async handleUserRegistered(event: UserRegisteredEvent): Promise<void> {
    this.logger.log(
      `UserRegisteredEvent { userId: ${event.userId}, email: ${event.email} }`,
    );

    const user = await this.prisma.user.findUnique({
      where: { id: event.userId },
    });

    if (!user) {
      this.logger.warn(
        `User ${event.userId} not found; skipping welcome email`,
      );
      return;
    }

    const name =
      [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;

    const emailJob = await this.emailQueue.add(
      'send-welcome',
      { userId: user.id, email: user.email, name },
      {
        delay: 1000,
        removeOnComplete: true,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );
    this.logger.log(`Added email:send-welcome job (${emailJob.id}) to queue`);
  }
}
