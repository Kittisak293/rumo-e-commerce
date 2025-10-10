import { Product } from 'src/products/entities/product.entity';
import { User } from 'src/users/entities/user.entity';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class CartItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @ManyToOne(() => Product, (product) => product.cartItems, {
    onDelete: 'SET NULL',
  })
  product: Product;

  @ManyToOne(() => User, (user) => user.cartItems, { onDelete: 'CASCADE' })
  user: User;

  @BeforeInsert()
  @BeforeUpdate()
  calculateSubtotal() {
    this.subtotal = Number(this.price) * this.quantity;
  }
}
