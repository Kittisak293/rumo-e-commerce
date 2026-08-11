import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { StripeProvider } from 'src/stripe/stripe.provider';
import { StripeService } from 'src/stripe/stripe.service';
import { ProcessedEvent } from 'src/stripe/processed-event.entity';
import { OrdersModule } from 'src/orders/orders.module';

@Module({
  imports: [OrdersModule, TypeOrmModule.forFeature([ProcessedEvent])],
  controllers: [PaymentsController],
  providers: [PaymentsService, StripeProvider, StripeService],
})
export class PaymentsModule {}
