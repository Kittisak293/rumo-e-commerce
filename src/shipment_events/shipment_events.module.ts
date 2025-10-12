import { Module } from '@nestjs/common';
import { ShipmentEventsService } from './shipment_events.service';
import { ShipmentEventsController } from './shipment_events.controller';

@Module({
  controllers: [ShipmentEventsController],
  providers: [ShipmentEventsService],
})
export class ShipmentEventsModule {}
