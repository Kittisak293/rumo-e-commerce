import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Address } from 'src/addresses/entities/address.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Address)
    private readonly addresssRepo: Repository<Address>,
  ) {}
  async create(createOrderDto: CreateOrderDto) {
    const user = await this.usersRepo.findOneByOrFail({
      id: createOrderDto.userId,
    });
    const address = await this.addresssRepo.findOneByOrFail({
      id: createOrderDto.addressId,
    });
    const order = this.ordersRepo.create({
      ...createOrderDto,
      user,
      address,
      status: createOrderDto.status as
        | 'pending'
        | 'paid'
        | 'shipped'
        | 'delivered'
        | 'cancelled'
        | 'shipping'
        | 'refunded',
    });
    await this.ordersRepo.save(order);
    return order;
  }

  async findAll() {
    return await this.ordersRepo.find({ relations: ['user', 'address'] });
  }

  async findOne(id: number) {
    return await this.ordersRepo.findOneOrFail({
      where: { id: id },
      relations: ['user', 'address'],
    });
  }

  async update(id: number, updateOrderDto: UpdateOrderDto) {
    // const user = await this.usersRepo.findOneByOrFail({
    //   id: updateOrderDto.userId,
    // });
    const address = await this.addresssRepo.findOneByOrFail({
      id: updateOrderDto.addressId,
    });
    const order = await this.ordersRepo.findOneOrFail({
      where: { id: id },
      relations: ['user', 'address'],
    });
    const updateData = {
      ...updateOrderDto,
      status: updateOrderDto.status as
        | 'pending'
        | 'paid'
        | 'shipped'
        | 'delivered'
        | 'cancelled'
        | 'shipping'
        | 'refunded',
    };
    // order.user = user;
    order.address = address;
    order.status = updateData.status;
    await this.ordersRepo.save(order);
    return this.ordersRepo.findOneOrFail({
      where: { id: id },
      relations: ['user', 'address'],
    });
  }

  async remove(id: number) {
    const order = await this.ordersRepo.findOneByOrFail({ id });
    await this.ordersRepo.softDelete(id);
    return order;
  }
}
