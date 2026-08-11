import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

export const STRIPE_CLIENT = 'STRIPE_CLIENT';

export const StripeProvider: Provider = {
  provide: STRIPE_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService): Stripe => {
    const secretKey = configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not set in backend/.env');
    }
    return new Stripe(secretKey, {
      // Pinned regardless of the installed SDK's typed "latest" version —
      // upgrading Stripe's API version is a deliberate, tested change, not
      // a side effect of bumping the npm package.
      apiVersion: '2024-06-20' as Stripe.LatestApiVersion,
    });
  },
};
