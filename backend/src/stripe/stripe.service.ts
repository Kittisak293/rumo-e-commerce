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

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);

  constructor(
    @Inject(STRIPE_CLIENT) private readonly stripe: Stripe,
    private readonly config: ConfigService,
    private readonly ordersService: OrdersService,
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

    return { received: true };
  }
}
