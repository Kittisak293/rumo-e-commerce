import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';
import { buildOtpEmail } from './templates/otp-email';
import {
  buildOrderConfirmationEmail,
  type OrderConfirmationData,
} from './templates/order-confirmation-email';
import {
  buildShipmentNotificationEmail,
  type ShipmentNotificationData,
} from './templates/shipment-notification-email';
import { OTP_TOKEN_TYPE, type OtpPurpose } from 'src/auth/otp.constants';

type MailTransport = 'smtp' | 'log';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly mode: MailTransport;
  private readonly transporter: Transporter | null;

  constructor(private readonly configService: ConfigService) {
    this.mode =
      this.configService.get<string>('MAIL_TRANSPORT', 'log') === 'smtp'
        ? 'smtp'
        : 'log';

    if (this.mode === 'log') {
      // The log transport prints the OTP to stdout. That is the one place the
      // code may ever be written to a log, so it must never reach production.
      if (process.env.NODE_ENV === 'production') {
        throw new Error('MAIL_TRANSPORT=log is forbidden in production');
      }
      this.logger.warn('using the log transport — no real email will be sent');
      this.transporter = null;
      return;
    }

    this.transporter = createTransport({
      host: this.configService.getOrThrow<string>('MAIL_HOST'),
      port: Number(this.configService.get('MAIL_PORT', 465)),
      secure: String(this.configService.get('MAIL_SECURE', 'true')) === 'true',
      auth: {
        user: this.configService.getOrThrow<string>('MAIL_USER'),
        // App Passwords are displayed in groups of four; Gmail wants them joined.
        pass: this.configService
          .getOrThrow<string>('MAIL_PASSWORD')
          .replace(/\s+/g, ''),
      },
    });
  }

  async sendOtp(
    to: string,
    code: string,
    ttlSeconds: number,
    purpose: OtpPurpose = OTP_TOKEN_TYPE,
  ): Promise<void> {
    const mail = buildOtpEmail(code, ttlSeconds, purpose);

    if (this.mode === 'log') {
      this.logger.warn(`[DEV MAIL] to=${to} purpose=${purpose} code=${code}`);
      return;
    }

    await this.transporter!.sendMail({
      from: this.configService.get<string>('MAIL_FROM'),
      to,
      ...mail,
    });
  }

  async sendOrderConfirmation(
    to: string,
    order: OrderConfirmationData,
  ): Promise<void> {
    const mail = buildOrderConfirmationEmail(order);

    if (this.mode === 'log') {
      this.logger.warn(`[DEV MAIL] to=${to} order=${order.orderNumber}`);
      return;
    }

    await this.transporter!.sendMail({
      from: this.configService.get<string>('MAIL_FROM'),
      to,
      ...mail,
    });
  }

  async sendShipmentNotification(
    to: string,
    shipment: ShipmentNotificationData,
  ): Promise<void> {
    const mail = buildShipmentNotificationEmail(shipment);

    if (this.mode === 'log') {
      this.logger.warn(
        `[DEV MAIL] to=${to} shipment order=${shipment.orderNumber} tracking=${shipment.trackingNumber}`,
      );
      return;
    }

    await this.transporter!.sendMail({
      from: this.configService.get<string>('MAIL_FROM'),
      to,
      ...mail,
    });
  }
}
