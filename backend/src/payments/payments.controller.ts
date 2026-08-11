import {
  Body,
  Controller,
  Headers,
  Post,
  Req,
  Request,
  UseGuards,
  type RawBodyRequest,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { PaymentsService } from './payments.service';
import { CreateIntentDto } from './dto/create-intent.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { StripeService } from 'src/stripe/stripe.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly stripeService: StripeService,
  ) {}

  @UseGuards(AuthGuard)
  @Post('create-intent')
  createIntent(@Request() req: any, @Body() dto: CreateIntentDto) {
    return this.paymentsService.createPaymentIntent(dto.orderId, req.user.sub);
  }

  // No AuthGuard — Stripe calls this directly, there is no JWT. Trust is
  // established by the webhook signature, not a bearer token.
  @Post('webhook')
  handleWebhook(
    @Req() req: RawBodyRequest<ExpressRequest>,
    @Headers('stripe-signature') signature: string,
  ) {
    const event = this.stripeService.constructEvent(
      req.rawBody as Buffer,
      signature,
    );
    return this.stripeService.handleWebhookEvent(event);
  }
}
