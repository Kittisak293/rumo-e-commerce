import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderItemDto } from './dto/create-order_item.dto';
import { UpdateOrderItemDto } from './dto/update-order_item.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderItem } from './entities/order_item.entity';
import { DeleteDateColumn, Repository } from 'typeorm';
import { Order } from 'src/orders/entities/order.entity';
import { Product } from 'src/products/entities/product.entity';

@Injectable()
export class OrderItemsService {
  constructor(
    @InjectRepository(OrderItem)
    private readonly orderItemsRepo: Repository<OrderItem>,
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
  ) {}

  async create(createOrderItemDto: CreateOrderItemDto) {
    const orderItem = this.orderItemsRepo.create(createOrderItemDto);
    const order = await this.ordersRepo.findOne({
      where: { id: createOrderItemDto.orderId },
    });
    if (!order) throw new NotFoundException('Order not found');

    const product = await this.productsRepo.findOne({
      where: { id: createOrderItemDto.productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    orderItem.order = order;
    orderItem.product = product;
    return await this.orderItemsRepo.save(orderItem);
  }

  async findAll() {
    return await this.orderItemsRepo.find({ relations: ['order', 'product'] });
  }

  async findOne(id: number) {
    return await this.orderItemsRepo.findOne({
      where: { id: id },
      relations: ['order', 'product'],
    });
  }

  async update(id: number, updateOrderItemDto: UpdateOrderItemDto) {
    const orderItem = await this.orderItemsRepo.findOneOrFail({
      where: { id: id },
    });

    const order = await this.ordersRepo.findOne({
      where: { id: updateOrderItemDto.orderId },
    });
    if (!order) throw new NotFoundException('Order not found');

    const product = await this.productsRepo.findOne({
      where: { id: updateOrderItemDto.productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    if (orderItem.quantity) {
      orderItem.quantity = updateOrderItemDto.quantity ?? orderItem.quantity;
    }
    if (orderItem.price) {
      orderItem.price = updateOrderItemDto.price ?? orderItem.price;
    }

    orderItem.order = order;
    orderItem.product = product;
    return await this.orderItemsRepo.save(orderItem);
  }

  async remove(id: number) {
    // const orderItem = await this.orderItemsRepo.findOneOrFail({
    //   where: { id: id },
    // });
    await this.orderItemsRepo.softDelete(id);
    return await this.orderItemsRepo.find();
  }
}
