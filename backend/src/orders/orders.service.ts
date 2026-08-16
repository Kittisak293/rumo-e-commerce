import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import Stripe from 'stripe';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, ALLOWED_TRANSITIONS } from './order-status.enum';
import { UpdateOrderDto } from './dto/update-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { EntityManager, In, Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Address } from 'src/addresses/entities/address.entity';
import { CartItem } from 'src/cart-items/entities/cart-item.entity';
import { OrderItem } from 'src/order_items/entities/order_item.entity';
import { Product } from 'src/products/entities/product.entity';
@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

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
    const address = await this.addresssRepo.findOneByOrFail({
      id: addressId,
      user: { id: userId },
    });
    const cartItems = await this.cartItemsRepo.find({
      where: { user: { id: userId } },
      relations: ['product'],
    });

    if (cartItems.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const subtotal = cartItems.reduce(
      (acc, item) => acc + Number(item.subtotal),
      0,
    );
    const shippingFee = 0;
    const total = subtotal + shippingFee;
    const totalQuantity = cartItems.reduce(
      (acc, item) => acc + item.quantity,
      0,
    );

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
    // Cart rows are intentionally left alone here — they're only removed once
    // the payment actually succeeds (see markPaid), so the confirm page can
    // still show the items/total while the PaymentIntent is in flight, and a
    // failed/abandoned payment leaves the cart untouched.

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

  // Admin shipping queue: orders that need or have had shipping action —
  // pending/processing/failed/cancelled/refunded orders never reach a
  // shipment, so they're excluded here. Oldest first: the longest-waiting
  // order is the most urgent to act on.
  async findShippingQueue() {
    return await this.ordersRepo.find({
      where: {
        status: In([
          OrderStatus.PAID,
          OrderStatus.SHIPPED,
          OrderStatus.SHIPPING,
          OrderStatus.DELIVERED,
        ]),
      },
      relations: [
        'user',
        'address',
        'orderItems',
        'orderItems.product',
        'shipments',
        'shipments.carrier',
        'shipments.shipmentEvents',
      ],
      order: {
        createdAt: 'ASC',
        shipments: { shipmentEvents: { occurredAt: 'DESC' } },
      },
    });
  }

  async findByUser(userId: number) {
    return await this.ordersRepo.find({
      where: { user: { id: userId } },
      relations: [
        'user',
        'address',
        'orderItems',
        'orderItems.product',
        'shipments',
        'shipments.carrier',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number) {
    return await this.ordersRepo.findOneOrFail({
      where: { id: id },
      relations: ['user', 'address'],
    });
  }

  // Admin order-detail read: unlike findOneForUser, not scoped to a
  // requesting user — the admin registry page needs to open any customer's
  // order. Loads the full graph so the detail drawer never needs a second
  // request.
  async findOneForAdmin(id: number) {
    const order = await this.ordersRepo.findOne({
      where: { id },
      relations: [
        'user',
        'address',
        'orderItems',
        'orderItems.product',
        'shipments',
        'shipments.carrier',
      ],
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  // Same as findOne but scoped to the caller — the order-detail page uses
  // this so one customer can't page through another's order by guessing ids.
  async findOneForUser(id: number, userId: number) {
    const order = await this.ordersRepo.findOne({
      where: { id, user: { id: userId } },
      relations: [
        'user',
        'address',
        'orderItems',
        'orderItems.product',
        'shipments',
        'shipments.carrier',
      ],
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  // The tracking page's single read: the order plus every shipment's full
  // event history, scoped to the requesting user. `shipmentEvents` sorts
  // newest-first to match how the timeline renders (mockup 3a).
  async findTracking(id: number, userId: number) {
    const order = await this.ordersRepo.findOne({
      where: { id, user: { id: userId } },
      relations: [
        'address',
        'orderItems',
        'orderItems.product',
        'shipments',
        'shipments.carrier',
        'shipments.shipmentEvents',
      ],
      order: { shipments: { shipmentEvents: { occurredAt: 'DESC' } } },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
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

  async findOwnedOrFail(orderId: number, userId: number) {
    const order = await this.ordersRepo.findOne({
      where: { id: orderId, user: { id: userId } },
      relations: ['user'],
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  // The confirmation email needs the whole graph — the plain findOne only
  // loads user and address. Returns null rather than throwing: the caller is
  // the webhook, where a missing order must not fail the request.
  async findWithItems(orderId: number): Promise<Order | null> {
    return this.ordersRepo.findOne({
      where: { id: orderId },
      relations: ['user', 'address', 'orderItems', 'orderItems.product'],
    });
  }

  // total is stored as a Postgres decimal, which comes back as a string —
  // coerce before doing arithmetic on it.
  async calculateTotalInSatang(orderId: number): Promise<number> {
    const order = await this.ordersRepo.findOneByOrFail({ id: orderId });
    return Math.round(Number(order.total) * 100);
  }

  async attachPaymentIntent(orderId: number, paymentIntentId: string) {
    await this.ordersRepo.update(
      { id: orderId },
      { stripePaymentIntentId: paymentIntentId },
    );
  }

  // No-op (not a throw) on a disallowed transition — a late webhook retry
  // arriving after the order has already moved on is expected, not an error.
  // Accepts an optional EntityManager so callers (the webhook handler) can
  // run this inside their own transaction instead of this.ordersRepo's own.
  async transitionStatus(
    orderId: number,
    target: OrderStatus,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(Order) : this.ordersRepo;
    const order = await repo.findOneByOrFail({ id: orderId });
    const allowed = ALLOWED_TRANSITIONS[order.status as OrderStatus];
    if (!allowed || !allowed.includes(target)) {
      this.logger.warn(
        `Ignored order #${orderId} transition ${order.status} -> ${target}`,
      );
      return;
    }
    order.status = target;
    await repo.save(order);
  }

  async markPaid(
    paymentIntent: Stripe.PaymentIntent,
    manager?: EntityManager,
  ): Promise<void> {
    const orderId = this.orderIdFromIntent(paymentIntent);
    if (orderId === null) return;
    await this.transitionStatus(orderId, OrderStatus.PAID, manager);
    await this.clearCartForOrder(orderId, manager);
  }

  // Only removes the cart rows for products that were actually part of this
  // order — not the user's whole cart — so anything added after checkout but
  // before the PaymentIntent settled survives.
  private async clearCartForOrder(
    orderId: number,
    manager?: EntityManager,
  ): Promise<void> {
    const orderRepo = manager ? manager.getRepository(Order) : this.ordersRepo;
    const order = await orderRepo.findOne({
      where: { id: orderId },
      relations: ['user', 'orderItems', 'orderItems.product'],
    });
    const productIds = order?.orderItems.map((item) => item.product.id) ?? [];
    if (!order || productIds.length === 0) return;

    const cartRepo = manager
      ? manager.getRepository(CartItem)
      : this.cartItemsRepo;
    await cartRepo.delete({
      user: { id: order.user.id },
      product: { id: In(productIds) },
    });
  }

  // PromptPay confirms but doesn't settle immediately — this is the
  // in-between state before the succeeded/failed webhook lands.
  async markProcessing(
    paymentIntent: Stripe.PaymentIntent,
    manager?: EntityManager,
  ): Promise<void> {
    const orderId = this.orderIdFromIntent(paymentIntent);
    if (orderId === null) return;
    await this.transitionStatus(orderId, OrderStatus.PROCESSING, manager);
  }

  async markFailed(
    paymentIntent: Stripe.PaymentIntent,
    manager?: EntityManager,
  ): Promise<void> {
    const orderId = this.orderIdFromIntent(paymentIntent);
    if (orderId === null) return;
    await this.transitionStatus(orderId, OrderStatus.FAILED, manager);
  }

  private orderIdFromIntent(
    paymentIntent: Stripe.PaymentIntent,
  ): number | null {
    const raw = paymentIntent.metadata?.orderId;
    const orderId = Number(raw);
    if (!raw || Number.isNaN(orderId)) {
      this.logger.error(
        `PaymentIntent ${paymentIntent.id} has no valid metadata.orderId`,
      );
      return null;
    }
    return orderId;
  }
}
