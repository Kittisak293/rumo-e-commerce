import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import Stripe from 'stripe';
import { STRIPE_CLIENT } from './stripe.provider';
import { ProcessedEvent } from './processed-event.entity';
import { OrdersService } from 'src/orders/orders.service';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);

  constructor(
    @Inject(STRIPE_CLIENT) private readonly stripe: Stripe,
    private readonly config: ConfigService,
    private readonly ordersService: OrdersService,
    private readonly mailService: MailService,
    @InjectRepository(ProcessedEvent)
    private readonly processedEventRepo: Repository<ProcessedEvent>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  constructEvent(rawBody: Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not set in backend/.env');
    }
    try {
      return this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (err) {
      throw new BadRequestException(
        `Webhook signature verification failed: ${(err as Error).message}`,
      );
    }
  }

  async handleWebhookEvent(event: Stripe.Event): Promise<{ received: true }> {
    const alreadyProcessed = await this.processedEventRepo.findOneBy({
      eventId: event.id,
    });
    if (alreadyProcessed) {
      return { received: true };
    }

    // The order transition and the ProcessedEvent row live or die together:
    // if markPaid/etc throws partway, this rolls back both, so the event
    // stays unmarked and Stripe's retry can actually redo the work. Marking
    // it processed only after the handler succeeds is what makes retries safe.
    await this.dataSource.transaction(async (manager) => {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.ordersService.markPaid(event.data.object, manager);
          break;
        case 'payment_intent.processing':
          await this.ordersService.markProcessing(event.data.object, manager);
          break;
        case 'payment_intent.payment_failed':
          await this.ordersService.markFailed(event.data.object, manager);
          break;
        default:
          this.logger.log(`Unhandled Stripe event type: ${event.type}`);
      }

      await manager
        .getRepository(ProcessedEvent)
        .save(
          manager.getRepository(ProcessedEvent).create({ eventId: event.id }),
        );
    });

    // Deliberately after the commit, never inside it: an SMTP failure must not
    // roll back an order that Stripe has already taken the money for.
    if (event.type === 'payment_intent.succeeded') {
      await this.sendOrderConfirmation(event.data.object);
    }

    return { received: true };
  }

  private async sendOrderConfirmation(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    try {
      const orderId = Number(paymentIntent.metadata?.orderId);
      if (!orderId || Number.isNaN(orderId)) return;

      const order = await this.ordersService.findWithItems(orderId);
      if (!order) {
        this.logger.error(`Order #${orderId} vanished before its email`);
        return;
      }

      await this.mailService.sendOrderConfirmation(order.user.email, {
        orderNumber: order.orderNumber ?? `#${order.id}`,
        items: order.orderItems.map((item) => ({
          name: item.product.name,
          quantity: item.quantity,
          lineTotal: Number(item.lineTotal),
        })),
        subtotal: Number(order.subtotal),
        shippingFee: Number(order.shippingFee),
        total: Number(order.total),
        address: {
          fullName: order.address.fullName,
          phone: order.address.phone,
          subdistrict: order.address.subdistrict,
          district: order.address.district,
          province: order.address.province,
          postalCode: order.address.postalCode,
        },
      });
    } catch (err) {
      // Swallowed on purpose. The event is already marked processed, so
      // throwing would only make Stripe retry a webhook that short-circuits
      // at the idempotency check — the mail would never be resent anyway,
      // and the 500 would misreport a payment that did settle.
      this.logger.error(
        `Order confirmation email failed: ${(err as Error).message}`,
      );
    }
  }
}
