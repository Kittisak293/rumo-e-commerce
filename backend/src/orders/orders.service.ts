import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Address } from 'src/addresses/entities/address.entity';
import { CartItem } from 'src/cart-items/entities/cart-item.entity';
import { OrderItem } from 'src/order_items/entities/order_item.entity';
import { Product } from 'src/products/entities/product.entity';
@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Address)
    private readonly addresssRepo: Repository<Address>,
    @InjectRepository(CartItem)
    private readonly cartItemsRepo: Repository<CartItem>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepo: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
  ) {}

  async checkout(userId: number, addressId: number) {
    const user = await this.usersRepo.findOneByOrFail({ id: userId });
    const address = await this.addresssRepo.findOneByOrFail({ id: addressId, user: { id: userId } });
    const cartItems = await this.cartItemsRepo.find({
      where: { user: { id: userId } },
      relations: ['product'],
    });

    if (cartItems.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const subtotal = cartItems.reduce((acc, item) => acc + item.subtotal, 0);
    const shippingFee = 0;
    const total = subtotal + shippingFee;
    const totalQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${dateStr}-${randomDigits}`;

    const order = this.ordersRepo.create({
      user,
      address,
      status: 'pending',
      subtotal,
      shippingFee,
      totalQuantity,
      total,
      orderNumber,
    });

    await this.ordersRepo.save(order);

    const orderItemsToSave = cartItems.map((cartItem) => {
      return this.orderItemsRepo.create({
        order,
        product: cartItem.product,
        price: cartItem.price,
        quantity: cartItem.quantity,
      });
    });

    await this.orderItemsRepo.save(orderItemsToSave);
    await this.cartItemsRepo.delete({ user: { id: userId } });

    return this.ordersRepo.findOne({
      where: { id: order.id },
      relations: ['orderItems', 'orderItems.product', 'address'],
    });
  }

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

  async findByUser(userId: number) {
    return await this.ordersRepo.find({
      where: { user: { id: userId } },
      relations: ['user', 'address', 'orderItems', 'orderItems.product'],
    });
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
