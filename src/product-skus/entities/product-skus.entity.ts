import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Product } from 'src/products/entities/product.entity';

@Entity('product_sku')
export class ProductSkus {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Product, (product) => product.skus, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  skuCode: string;

  @Column({ nullable: true })
  barcode: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: string;

  @Column({
    name: 'compare_at_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  compareAtPrice: string | null;

  @Column({ name: 'stock_qty', type: 'int' })
  stockQty: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  weight: string;

  @Column({ name: 'image_url', nullable: true })
  imageUrl: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
