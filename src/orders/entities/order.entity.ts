import { Address } from 'src/addresses/entities/address.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
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

  @Column({ default: 'pending' })
  status:
    | 'pending'
    | 'paid'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'shipping';

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  shippingFee: number;

  @Column({ default: 0 })
  totalQuantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ unique: true })
  orderNumber?: string;
}
