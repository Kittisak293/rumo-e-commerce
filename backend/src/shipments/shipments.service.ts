import { Repository } from 'typeorm';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { Shipment } from './entities/shipment.entity';
import { ShipmentStatus } from './shipment-status.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { Order } from 'src/orders/entities/order.entity';
import { Carrier } from 'src/carriers/entities/carrier.entity';
import { buildTrackingUrl } from 'src/carriers/tracking-url.util';
import { MailService } from 'src/mail/mail.service';
import { OrdersService } from 'src/orders/orders.service';
import { OrderStatus } from 'src/orders/order-status.enum';

@Injectable()
export class ShipmentsService {
  private readonly logger = new Logger(ShipmentsService.name);

  constructor(
    @InjectRepository(Shipment)
    private readonly shipmentsRepo: Repository<Shipment>,
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
    @InjectRepository(Carrier)
    private readonly carriersRepo: Repository<Carrier>,
    private readonly mailService: MailService,
    private readonly ordersService: OrdersService,
  ) {}
  async create(createShipmentDto: CreateShipmentDto) {
    // relations: ['user'] — the dispatch email needs an address to send to,
    // and User isn't eager-loaded on Order.
    const order = await this.ordersRepo.findOneOrFail({
      where: { id: createShipmentDto.orderId },
      relations: ['user'],
    });
    const carrier = await this.carriersRepo.findOneByOrFail({
      id: createShipmentDto.carrierId,
    });
    const shipment = this.shipmentsRepo.create({
      trackingNumber: createShipmentDto.trackingNumber,
      status: createShipmentDto.status ?? ShipmentStatus.PENDING,
      lastLocation: createShipmentDto.lastLocation ?? null,
      estimatedDeliveryAt: createShipmentDto.estimatedDeliveryAt
        ? new Date(createShipmentDto.estimatedDeliveryAt)
        : null,
      order,
      carrier,
    });
    const saved = await this.shipmentsRepo.save(shipment);

    // Handing the parcel to a carrier is what makes an order 'shipped' —
    // nothing else in the system writes that status.
    await this.ordersService.transitionStatus(order.id, OrderStatus.SHIPPED);

    await this.sendDispatchNotification(order, carrier, createShipmentDto);

    return saved;
  }

  // Best-effort: a stuck SMTP call must never fail the shipment creation
  // itself — the shipment already exists in the DB by this point.
  // Takes the DTO (not the saved entity) so trackingNumber reads as the
  // required `string` the create endpoint validated, not the entity's
  // `string | null` (nullable only to let old pre-column rows exist).
  private async sendDispatchNotification(
    order: Order,
    carrier: Carrier,
    dto: CreateShipmentDto,
  ): Promise<void> {
    try {
      await this.mailService.sendShipmentNotification(order.user.email, {
        orderNumber: order.orderNumber ?? `#${order.id}`,
        carrierName: carrier.name,
        trackingNumber: dto.trackingNumber,
        trackingUrl: buildTrackingUrl(carrier, dto.trackingNumber),
        estimatedDeliveryAt: dto.estimatedDeliveryAt,
      });
    } catch (err) {
      this.logger.error(
        `Shipment notification email failed for order #${order.id}: ${(err as Error).message}`,
      );
    }
  }

  async findAll() {
    return await this.shipmentsRepo.find({ relations: ['order', 'carrier'] });
  }

  async findOne(id: number) {
    return await this.shipmentsRepo.findOne({
      where: { id: id },
      relations: ['order', 'carrier', 'shipmentEvents'],
      order: { shipmentEvents: { occurredAt: 'DESC' } },
    });
  }

  async update(id: number, updateShipmentDto: UpdateShipmentDto) {
    const shipment = await this.shipmentsRepo.findOneOrFail({
      where: { id: id },
      relations: ['order', 'carrier'],
    });

    if (updateShipmentDto.carrierId !== undefined) {
      shipment.carrier = await this.carriersRepo.findOneByOrFail({
        id: updateShipmentDto.carrierId,
      });
    }
    if (updateShipmentDto.trackingNumber !== undefined) {
      shipment.trackingNumber = updateShipmentDto.trackingNumber;
    }
    if (updateShipmentDto.lastLocation !== undefined) {
      shipment.lastLocation = updateShipmentDto.lastLocation;
    }
    if (updateShipmentDto.estimatedDeliveryAt !== undefined) {
      shipment.estimatedDeliveryAt = new Date(
        updateShipmentDto.estimatedDeliveryAt,
      );
    }
    shipment.status = updateShipmentDto.status ?? shipment.status;
    await this.shipmentsRepo.save(shipment);

    return await this.findOne(id);
  }

  async remove(id: number) {
    const shipment = await this.shipmentsRepo.findOne({
      where: { id: id },
      relations: ['order', 'carrier'],
    });
    await this.shipmentsRepo.softDelete(id);
    return shipment;
  }
}
