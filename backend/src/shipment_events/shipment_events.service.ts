import { Injectable } from '@nestjs/common';
import { CreateShipmentEventDto } from './dto/create-shipment_event.dto';
import { UpdateShipmentEventDto } from './dto/update-shipment_event.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShipmentEvent } from './entities/shipment_event.entity';
import { Shipment } from 'src/shipments/entities/shipment.entity';
import { ShipmentStatus } from 'src/shipments/shipment-status.enum';
import { OrdersService } from 'src/orders/orders.service';
import { OrderStatus } from 'src/orders/order-status.enum';

// A parcel scan is the only signal we get that an order has moved past
// 'shipped'. Statuses that say nothing new about the order (`pending`,
// `failed`, `returned`) are absent on purpose — they leave Order.status alone.
const ORDER_STATUS_FOR_EVENT: Partial<Record<ShipmentStatus, OrderStatus>> = {
  [ShipmentStatus.PICKED_UP]: OrderStatus.SHIPPING,
  [ShipmentStatus.IN_TRANSIT]: OrderStatus.SHIPPING,
  [ShipmentStatus.OUT_FOR_DELIVERY]: OrderStatus.SHIPPING,
  [ShipmentStatus.DELIVERED]: OrderStatus.DELIVERED,
};

@Injectable()
export class ShipmentEventsService {
  constructor(
    @InjectRepository(ShipmentEvent)
    private readonly shipmentEventsRepo: Repository<ShipmentEvent>,
    @InjectRepository(Shipment)
    private readonly shipmentsRepo: Repository<Shipment>,
    private readonly ordersService: OrdersService,
  ) {}

  async create(createShipmentEventDto: CreateShipmentEventDto) {
    const shipment = await this.shipmentsRepo.findOneOrFail({
      where: { id: createShipmentEventDto.shipmentId },
      relations: ['order'],
    });

    const shipmentEvent = this.shipmentEventsRepo.create({
      status: createShipmentEventDto.status,
      description: createShipmentEventDto.description,
      location: createShipmentEventDto.location ?? null,
      occurredAt: createShipmentEventDto.occurredAt
        ? new Date(createShipmentEventDto.occurredAt)
        : new Date(),
      shipment,
    });

    const saved = await this.shipmentEventsRepo.save(shipmentEvent);

    // The event is the source of truth for where the parcel is; mirror it onto
    // the shipment so list views don't have to load the whole timeline.
    shipment.status = createShipmentEventDto.status;
    if (createShipmentEventDto.location) {
      shipment.lastLocation = createShipmentEventDto.location;
    }
    await this.shipmentsRepo.save(shipment);

    const orderStatus = ORDER_STATUS_FOR_EVENT[createShipmentEventDto.status];
    if (orderStatus) {
      // transitionStatus no-ops (and logs) on a disallowed move, so a late
      // 'in_transit' scan on an already-delivered order can't walk it back.
      await this.ordersService.transitionStatus(shipment.order.id, orderStatus);
    }

    return saved;
  }

  async findAll(shipmentId?: number) {
    return await this.shipmentEventsRepo.find({
      where: shipmentId ? { shipment: { id: shipmentId } } : {},
      order: { occurredAt: 'DESC' },
    });
  }

  async findOne(id: number) {
    return await this.shipmentEventsRepo.findOne({ where: { id: id } });
  }

  async update(id: number, updateShipmentEventDto: UpdateShipmentEventDto) {
    const shipmentEvent = await this.shipmentEventsRepo.findOneOrFail({
      where: { id: id },
    });

    if (updateShipmentEventDto.shipmentId !== undefined) {
      shipmentEvent.shipment = await this.shipmentsRepo.findOneByOrFail({
        id: updateShipmentEventDto.shipmentId,
      });
    }
    shipmentEvent.status =
      updateShipmentEventDto.status ?? shipmentEvent.status;
    shipmentEvent.description =
      updateShipmentEventDto.description ?? shipmentEvent.description;
    if (updateShipmentEventDto.location !== undefined) {
      shipmentEvent.location = updateShipmentEventDto.location;
    }
    if (updateShipmentEventDto.occurredAt !== undefined) {
      shipmentEvent.occurredAt = new Date(updateShipmentEventDto.occurredAt);
    }

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
