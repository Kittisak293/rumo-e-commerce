import { Injectable } from '@nestjs/common';
import { CreateShipmentEventDto } from './dto/create-shipment_event.dto';
import { UpdateShipmentEventDto } from './dto/update-shipment_event.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShipmentEvent } from './entities/shipment_event.entity';
import { Shipment } from 'src/shipments/entities/shipment.entity';

@Injectable()
export class ShipmentEventsService {
  constructor(
    @InjectRepository(ShipmentEvent)
    private readonly shipmentEventsRepo: Repository<ShipmentEvent>,
    @InjectRepository(Shipment)
    private readonly shipmentsRepo: Repository<Shipment>,
  ) {}

  async create(createShipmentEventDto: CreateShipmentEventDto) {
    const shipmentEvent = this.shipmentEventsRepo.create(
      createShipmentEventDto,
    );
    const shipment = await this.shipmentsRepo.findOneByOrFail({
      id: createShipmentEventDto.shipmentId,
    });

    shipmentEvent.shipment = shipment;

    return await this.shipmentEventsRepo.save(shipmentEvent);
  }

  async findAll() {
    return await this.shipmentEventsRepo.find();
  }

  async findOne(id: number) {
    return await this.shipmentEventsRepo.findOne({ where: { id: id } });
  }

  async update(id: number, updateShipmentEventDto: UpdateShipmentEventDto) {
    const shipmentEvent = await this.shipmentEventsRepo.findOneOrFail({
      where: { id: id },
    });
    const shipment = await this.shipmentsRepo.findOneByOrFail({
      id: updateShipmentEventDto.shipmentId,
    });

    shipmentEvent.shipment = shipment;

    return await this.shipmentEventsRepo.save(shipmentEvent);
  }

  async remove(id: number) {
    const shipmentEvent = await this.shipmentEventsRepo.findOneOrFail({
      where: { id: id },
    });

    await this.shipmentEventsRepo.softDelete(id);
    return shipmentEvent;
  }
}
