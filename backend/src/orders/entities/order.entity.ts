import { Address } from 'src/addresses/entities/address.entity';
import { OrderItem } from 'src/order_items/entities/order_item.entity';
import { Shipment } from 'src/shipments/entities/shipment.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.orders, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Address, (address) => address.orders, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'shipping_address_id' })
  address: Address;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, {
    onDelete: 'CASCADE',
  })
  orderItems: OrderItem[];

  @OneToMany(() => Shipment, (shipment) => shipment.order, {
    onDelete: 'CASCADE',
  })
  shipments: Shipment[];

  @Column({ default: 'pending' })
  status:
    | 'pending'
    | 'processing'
    | 'paid'
    | 'failed'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'shipping'
    | 'refunded';

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    name: 'shipping_fee',
  })
  shippingFee: number;

  // Explicit type: a bare `number` design type resolves to different native
  // columns per driver (sqlite -> float, postgres -> integer).
  @Column({ type: 'int', default: 0, name: 'total_quantity' })
  totalQuantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ unique: true, name: 'order_number' })
  orderNumber?: string;

  @Column({
    type: 'varchar',
    nullable: true,
    name: 'stripe_payment_intent_id',
  })
  stripePaymentIntentId?: string | null;

  // Explicit timestamptz: TypeORM's Postgres default for these is `timestamp`
  // (no zone). Node writes UTC digits into it, but `pg` reads them back as
  // local server time on the way out, shifting every value by the server's
  // UTC offset. timestamptz stores the zone so there's no round-trip to lose.
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date;
}
