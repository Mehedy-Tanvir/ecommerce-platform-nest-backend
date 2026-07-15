import { Logger } from '@nestjs/common';
import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';

export interface SendWelcomeJob {
  userId: string;
  email: string;
  name: string;
}

export interface SendOrderConfirmationJob {
  orderId: string;
  email: string;
  totalAmount: number;
}

export interface SendPasswordResetJob {
  email: string;
  resetToken: string;
}

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  @Process('send-welcome')
  sendWelcome(job: Job<SendWelcomeJob>) {
    const { email, name } = job.data;
    this.logger.log(`Sending welcome email to ${email}`);
    // TODO: call email service to render and send the welcome template
    return { sent: true, email, name };
  }

  @Process('send-order-confirmation')
  sendOrderConfirmation(job: Job<SendOrderConfirmationJob>) {
    const { orderId, email, totalAmount } = job.data;
    this.logger.log(
      `Sending order confirmation ${orderId} to ${email} (total: ${totalAmount})`,
    );
    // TODO: render order confirmation template and send
    return { sent: true, orderId, email };
  }

  @Process('send-password-reset')
  sendPasswordReset(job: Job<SendPasswordResetJob>) {
    const { email, resetToken } = job.data;
    this.logger.log(`Sending password reset to ${email}`);
    // TODO: render password reset template (with resetToken) and send
    return { sent: true, email, hasToken: !!resetToken };
  }
}
