import { Module } from '@nestjs/common';
import { ProductSkuOptionValuesService } from './product-sku-option-values.service';
import { ProductSkuOptionValuesController } from './product-sku-option-values.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductSkuOptionValue } from './entities/product-sku-option-value.entity';
import { ProductSku } from 'src/product-skus/entities/product-sku.entity';
import { ProductOptionValue } from 'src/product-option-values/entities/product-option-value.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductSkuOptionValue,
      ProductSku,
      ProductOptionValue,
    ]),
  ],
  controllers: [ProductSkuOptionValuesController],
  providers: [ProductSkuOptionValuesService],
})
export class ProductSkuOptionValuesModule {}
