import { Module } from '@nestjs/common';
import { ShipmentsService } from './shipments.service';
import { ShipmentsController } from './shipments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shipment } from './entities/shipment.entity';
import { ShipmentEvent } from 'src/shipment_events/entities/shipment_event.entity';
import { Order } from 'src/orders/entities/order.entity';
import { Carrier } from 'src/carriers/entities/carrier.entity';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Shipment, ShipmentEvent, Order, Carrier]),
    MailModule,
  ],
  controllers: [ShipmentsController],
  providers: [ShipmentsService],
})
export class ShipmentsModule {}
