import { CartItem } from 'src/cart-items/entities/cart-item.entity';
import { Category } from 'src/categories/entities/category.entity';
import { StoreType } from 'src/common/enums/store-type.enum';
import { OrderItem } from 'src/order_items/entities/order_item.entity';
import { ProductImage } from 'src/product-images/entities/product-image.entity';
import { ProductOption } from 'src/product-options/entities/product-option.entity';
import { ProductSku } from 'src/product-skus/entities/product-skus.entity';
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
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  price: number;

  @Column()
  stock: number;

  @Column({ name: 'rating_avg' })
  ratingAvg: number;

  @Column({ name: 'rating_count' })
  ratingCount: number;

  @Column({ name: 'sold_count' })
  soldCount: number;

  @Column({ default: '/product-images/unknown.jpg' })
  imageUrl: string;

  @Column({
    type: 'text',
    enum: StoreType,
    default: StoreType.SELLER,
  })
  storeType: StoreType;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => CartItem, (cartItem) => cartItem.product)
  cartItems: CartItem[];

  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  orderItems: OrderItem[];

  @OneToMany(() => ProductImage, (productImage) => productImage.product)
  productImages: ProductImage[];

  @OneToMany(() => ProductOption, (option) => option.product)
  productOptions: ProductOption[];

  @OneToMany(() => ProductSku, (sku) => sku.product)
  skus: ProductSku[];
}
