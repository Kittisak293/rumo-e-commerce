import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { STRIPE_CLIENT } from 'src/stripe/stripe.provider';
import { OrdersService } from 'src/orders/orders.service';

const REUSABLE_INTENT_STATUSES: Stripe.PaymentIntent.Status[] = [
  'requires_payment_method',
  'requires_confirmation',
  'requires_action',
];

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(STRIPE_CLIENT) private readonly stripe: Stripe,
    private readonly ordersService: OrdersService,
  ) {}

  async createPaymentIntent(orderId: number, userId: number) {
    const order = await this.ordersService.findOwnedOrFail(orderId, userId);

    if (order.status === 'paid') {
      throw new BadRequestException('Order is already paid');
    }

    if (order.stripePaymentIntentId) {
      const existingIntent = await this.stripe.paymentIntents.retrieve(
        order.stripePaymentIntentId,
      );
      if (REUSABLE_INTENT_STATUSES.includes(existingIntent.status)) {
        return { clientSecret: existingIntent.client_secret };
      }
    }

    // Amount is derived from the DB, never taken from the client — otherwise
    // a caller could pay whatever amount they want for someone else's order.
    const amountInSatang =
      await this.ordersService.calculateTotalInSatang(orderId);

    const intent = await this.stripe.paymentIntents.create(
      {
        amount: amountInSatang,
        currency: 'thb',
        metadata: {
          orderId: String(orderId),
          userId: String(userId),
        },
        automatic_payment_methods: { enabled: true },
      },
      { idempotencyKey: `pi-create-${orderId}` },
    );

    await this.ordersService.attachPaymentIntent(orderId, intent.id);

    return { clientSecret: intent.client_secret };
  }
}
