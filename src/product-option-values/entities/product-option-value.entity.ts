import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { ProductOption } from 'src/product-options/entities/product-option.entity';
import { ProductSkuOptionValue } from 'src/product-sku-option-values/entities/product-sku-option-value.entity';

@Entity('product_option_value')
export class ProductOptionValue {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ProductOption, (option) => option.value, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_option_id' })
  productOption: ProductOption;

  @OneToMany(() => ProductSkuOptionValue, (skuVal) => skuVal.productOptionValue)
  skuValues: ProductSkuOptionValue[];

  @Column({ length: 100 })
  value: string; // ค่าที่โชว์ เช่น "ดำ", "M"

  @Column({ name: 'value_code', length: 100 })
  valueCode: string; // โค้ดภายใน เช่น "black", "M"

  @Column({
    name: 'extra_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  extraPrice: string | null; // ใช้ string เพราะ TypeORM decimal -> string

  @Column({ name: 'sort_order', type: 'int', default: 1 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
