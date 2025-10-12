import { Module } from '@nestjs/common';
import { ShipmentEventsService } from './shipment_events.service';
import { ShipmentEventsController } from './shipment_events.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShipmentEvent } from './entities/shipment_event.entity';
import { Shipment } from 'src/shipments/entities/shipment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ShipmentEvent, Shipment])],
  controllers: [ShipmentEventsController],
  providers: [ShipmentEventsService],
})
export class ShipmentEventsModule {}
