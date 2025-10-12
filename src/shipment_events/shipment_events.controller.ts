import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ShipmentEventsService } from './shipment_events.service';
import { CreateShipmentEventDto } from './dto/create-shipment_event.dto';
import { UpdateShipmentEventDto } from './dto/update-shipment_event.dto';

@Controller('shipment-events')
export class ShipmentEventsController {
  constructor(private readonly shipmentEventsService: ShipmentEventsService) {}

  @Post()
  create(@Body() createShipmentEventDto: CreateShipmentEventDto) {
    return this.shipmentEventsService.create(createShipmentEventDto);
  }

  @Get()
  findAll() {
    return this.shipmentEventsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shipmentEventsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateShipmentEventDto: UpdateShipmentEventDto) {
    return this.shipmentEventsService.update(+id, updateShipmentEventDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shipmentEventsService.remove(+id);
  }
}
