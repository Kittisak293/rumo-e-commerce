import { Repository } from 'typeorm';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { Shipment } from './entities/shipment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { Order } from 'src/orders/entities/order.entity';
import { Carrier } from 'src/carriers/entities/carrier.entity';
import { MailService } from 'src/mail/mail.service';

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
    const shipment = this.shipmentsRepo.create(createShipmentDto);
    shipment.order = order;
    shipment.carrier = carrier;
    const saved = await this.shipmentsRepo.save(shipment);

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
        trackingUrl: carrier.trackingUrlTemplate
          ? carrier.trackingUrlTemplate.replace(
              '{trackingNumber}',
              encodeURIComponent(dto.trackingNumber),
            )
          : null,
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
      relations: ['order', 'carrier'],
    });
  }

  async update(id: number, updateShipmentDto: UpdateShipmentDto) {
    const shipment = await this.shipmentsRepo.findOne({
      where: { id: id },
      relations: ['order', 'carrier'],
    });
    if (shipment) {
      shipment.status = updateShipmentDto.status ?? shipment.status;
      await this.shipmentsRepo.save(shipment);
    }
    return await this.shipmentsRepo.findOne({
      where: { id: id },
      relations: ['order', 'carrier'],
    });
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
