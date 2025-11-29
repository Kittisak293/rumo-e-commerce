import { Module } from '@nestjs/common';
import { ProductSkuOptionValuesService } from './product-sku-option-values.service';
import { ProductSkuOptionValuesController } from './product-sku-option-values.controller';

@Module({
  controllers: [ProductSkuOptionValuesController],
  providers: [ProductSkuOptionValuesService],
})
export class ProductSkuOptionValuesModule {}
