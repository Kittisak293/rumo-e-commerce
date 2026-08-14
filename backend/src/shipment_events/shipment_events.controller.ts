import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ShipmentEventsService } from './shipment_events.service';
import { CreateShipmentEventDto } from './dto/create-shipment_event.dto';
import { UpdateShipmentEventDto } from './dto/update-shipment_event.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

// Admin-only — see the note on ShipmentsController. Customers get their
// timeline through `GET /orders/:id/tracking`.
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
@Controller('shipment-events')
export class ShipmentEventsController {
  constructor(private readonly shipmentEventsService: ShipmentEventsService) {}

  @Post()
  create(@Body() createShipmentEventDto: CreateShipmentEventDto) {
    return this.shipmentEventsService.create(createShipmentEventDto);
  }

  @Get()
  findAll(@Query('shipmentId') shipmentId?: string) {
    return this.shipmentEventsService.findAll(
      shipmentId ? +shipmentId : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shipmentEventsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateShipmentEventDto: UpdateShipmentEventDto,
  ) {
    return this.shipmentEventsService.update(+id, updateShipmentEventDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shipmentEventsService.remove(+id);
  }
}
