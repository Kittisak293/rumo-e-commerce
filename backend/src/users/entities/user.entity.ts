import { Address } from 'src/addresses/entities/address.entity';
import { CartItem } from 'src/cart-items/entities/cart-item.entity';
import { Order } from 'src/orders/entities/order.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  /**
   * False until the address is proven via an email_verify OTP challenge.
   * Login refuses to send a second factor while this is false.
   */
  @Column({ name: 'email_verified', type: 'boolean', default: false })
  emailVerified: boolean;

  @Column({
    type: 'simple-enum',
    enum: ['admin', 'customer'],
    default: 'customer',
  })
  role: 'admin' | 'customer';

  @Column()
  name: string;

  /**
   * Nullable because self-registration does not ask for it — the signup form
   * collects name, email and password only.
   */
  // `type` must be explicit: TypeORM cannot infer a column type from the
  // `number | null` union and rejects it as an unsupported Object.
  @Column({ type: 'int', nullable: true })
  age: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToMany(() => CartItem, (cartItem) => cartItem.user)
  cartItems: CartItem[];

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @OneToMany(() => Address, (address) => address.user)
  addresses: Address[];
}
