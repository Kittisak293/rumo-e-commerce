import { Repository } from 'typeorm';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { Shipment } from './entities/shipment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Order } from 'src/orders/entities/order.entity';
import { Carrier } from 'src/carriers/entities/carrier.entity';

@Injectable()
export class ShipmentsService {
  constructor(
    @InjectRepository(Shipment)
    private readonly shipmentsRepo: Repository<Shipment>,
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
    @InjectRepository(Carrier)
    private readonly carriersRepo: Repository<Carrier>,
  ) {}
  async create(createShipmentDto: CreateShipmentDto) {
    const order = await this.ordersRepo.findOneByOrFail({
      id: createShipmentDto.orderId,
    });
    const carrier = await this.carriersRepo.findOneByOrFail({
      id: createShipmentDto.carrierId,
    });
    const shipment = this.shipmentsRepo.create(createShipmentDto);
    shipment.order = order;
    shipment.carrier = carrier;
    return await this.shipmentsRepo.save(shipment);
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
