import { Module } from '@nestjs/common';
import { ShipmentEventsService } from './shipment_events.service';
import { ShipmentEventsController } from './shipment_events.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShipmentEvent } from './entities/shipment_event.entity';
import { Shipment } from 'src/shipments/entities/shipment.entity';
import { OrdersModule } from 'src/orders/orders.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShipmentEvent, Shipment]),
    OrdersModule,
    AuthModule,
  ],
  controllers: [ShipmentEventsController],
  providers: [ShipmentEventsService],
})
export class ShipmentEventsModule {}
