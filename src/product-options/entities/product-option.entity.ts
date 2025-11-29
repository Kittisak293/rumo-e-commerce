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

@Entity('product_option')
export class ProductOption {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Product, (product) => product.productOptions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ length: 100 })
  name: string; // ชื่อภายใน เช่น "color", "size"

  @Column({ name: 'display_name', length: 100 })
  displayName: string; // ชื่อที่โชว์หน้าเว็บ เช่น "สี", "ไซต์"

  @Column({ name: 'sort_order', type: 'int', default: 1 })
  sortOrder: number; // ลำดับการแสดง (1 = แสดงก่อน)

  @Column({ name: 'is_required', type: 'boolean', default: false })
  isRequired: boolean; // ต้องเลือกหรือไม่

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
