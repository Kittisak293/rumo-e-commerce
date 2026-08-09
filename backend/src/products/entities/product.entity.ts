import { CartItem } from 'src/cart-items/entities/cart-item.entity';
import { Category } from 'src/categories/entities/category.entity';
import { StoreType } from 'src/common/enums/store-type.enum';
import { OrderItem } from 'src/order_items/entities/order_item.entity';
import { ProductImage } from 'src/product-images/entities/product-image.entity';
import { ProductOption } from 'src/product-options/entities/product-option.entity';
import { ProductSku } from 'src/product-skus/entities/product-sku.entity';
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

  // `type` is explicit everywhere below: a bare `@Column() foo: number` lets
  // TypeORM guess the native type from the driver, and sqlite's guess (float)
  // silently diverges from postgres's guess (integer) for the exact same
  // entity. That divergence is invisible until real decimal data — ratingAvg
  // here — hits the postgres integer column and the insert fails.
  @Column({ type: 'int' })
  price: number;

  @Column({ type: 'int' })
  stock: number;

  // node-postgres returns `decimal`/`numeric` columns as strings (it can't
  // safely coerce arbitrary precision to a JS number), unlike sqlite which
  // handed back a real number for this same untyped column. The transformer
  // restores the number-in, number-out contract the frontend's `ratingAvg:
  // number` and its rating filter already assume.
  @Column({
    name: 'rating_avg',
    type: 'decimal',
    precision: 2,
    scale: 1,
    transformer: {
      to: (value: number) => value,
      from: (value: string | null) => (value === null ? null : parseFloat(value)),
    },
  })
  ratingAvg: number;

  @Column({ name: 'rating_count', type: 'int' })
  ratingCount: number;

  @Column({ name: 'sold_count', type: 'int' })
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
