import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ProductSku } from 'src/product-skus/entities/product-skus.entity';
import { ProductOptionValue } from 'src/product-option-values/entities/product-option-value.entity';

@Entity('product_sku_option_value')
export class ProductSkuOptionValue {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ProductSku, (sku) => sku.optionValues, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_sku_id' })
  productSku: ProductSku;

  @ManyToOne(() => ProductOptionValue, (value) => value.skuValues, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_option_value_id' })
  productOptionValue: ProductOptionValue;
}
