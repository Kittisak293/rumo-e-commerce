import { Injectable } from '@nestjs/common';
import { CreateShipmentEventDto } from './dto/create-shipment_event.dto';
import { UpdateShipmentEventDto } from './dto/update-shipment_event.dto';

@Injectable()
export class ShipmentEventsService {
  create(createShipmentEventDto: CreateShipmentEventDto) {
    return 'This action adds a new shipmentEvent';
  }

  findAll() {
    return `This action returns all shipmentEvents`;
  }

  findOne(id: number) {
    return `This action returns a #${id} shipmentEvent`;
  }

  update(id: number, updateShipmentEventDto: UpdateShipmentEventDto) {
    return `This action updates a #${id} shipmentEvent`;
  }

  remove(id: number) {
    return `This action removes a #${id} shipmentEvent`;
  }
}
