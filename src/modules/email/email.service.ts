import { Global, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import { compile } from 'handlebars';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { EmailOptions } from './interfaces/email-options.interface';

@Global()
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter;
  private readonly from: string;
  private readonly templatesDir = join(process.cwd(), 'src', 'modules', 'email', 'templates');

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

  async sendEmail(options: EmailOptions): Promise<void> {
    const html = await this.renderTemplate(options.template, options.context);
    await this.transporter.sendMail({
      from: this.from,
      to: options.to,
      subject: options.subject,
      html,
    });
    this.logger.log(`Email sent to ${options.to} (template: ${options.template})`);
  }

  private async renderTemplate(
    templateName: string,
    context: Record<string, unknown>,
  ): Promise<string> {
    const filePath = join(this.templatesDir, `${templateName}.hbs`);
    const source = await readFile(filePath, 'utf-8');
    const template = compile(source);
    return template(context);
  }
}
