import { Global, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import { compile, type TemplateDelegate } from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';
import { EmailOptions } from './interfaces/email-options.interface';

@Global()
@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter;
  private readonly from: string;
  // NOTE (Vercel/serverless): templates are loaded at startup from __dirname,
  // which resolves to the bundled output directory after build. Ensure the
  // .hbs files are included in the deployment bundle (see nest-cli.json assets).
  private readonly templatesDir = join(__dirname, 'templates');
  private readonly templates = new Map<string, TemplateDelegate>();

  constructor(private readonly configService: ConfigService) {
    this.from = this.configService.get<string>('EMAIL_FROM', 'noreply@ecommerce-platform.com');
    this.transporter = createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: this.configService.get<number>('SMTP_PORT', 587) === 465,
      auth:
        this.configService.get<string>('SMTP_USER') &&
        this.configService.get<string>('SMTP_PASS')
          ? {
              user: this.configService.get<string>('SMTP_USER'),
              pass: this.configService.get<string>('SMTP_PASS'),
            }
          : undefined,
    });
  }

  async onModuleInit(): Promise<void> {
    this.loadTemplates();
  }

  private loadTemplates(): void {
    const templateNames = ['welcome', 'order-confirmation', 'password-reset'];
    for (const name of templateNames) {
      const filePath = join(this.templatesDir, `${name}.hbs`);
      const source = readFileSync(filePath, 'utf-8');
      this.templates.set(name, compile(source));
    }
    this.logger.log(`Loaded ${this.templates.size} email templates`);
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    const template = this.templates.get(options.template);
    if (!template) {
      throw new Error(`Template "${options.template}" not found`);
    }
    const html = template(options.context);
    await this.transporter.sendMail({
      from: this.from,
      to: options.to,
      subject: options.subject,
      html,
    });
    this.logger.log(`Email sent to ${options.to} (template: ${options.template})`);
  }

  async sendWelcomeEmail(to: string, firstName: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Welcome to Our Platform!',
      template: 'welcome',
      context: {
        firstName,
        shopUrl: process.env.SHOP_URL ?? 'http://localhost:3001',
      },
    });
  }

  async sendOrderConfirmation(
    to: string,
    firstName: string,
    orderNumber: string,
    items: Array<{ name: string; quantity: number; price: string }>,
    total: string,
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: `Order Confirmed — #${orderNumber}`,
      template: 'order-confirmation',
      context: { firstName, orderNumber, items, total },
    });
  }

  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Password Reset Request',
      template: 'password-reset',
      context: { resetUrl },
    });
  }
}
