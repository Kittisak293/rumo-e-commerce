import { Module } from '@nestjs/common';
import { ProductSkuOptionsService } from './product-sku-options.service';
import { ProductSkuOptionsController } from './product-sku-options.controller';

@Module({
  controllers: [ProductSkuOptionsController],
  providers: [ProductSkuOptionsService],
})
export class ProductSkuOptionsModule {}
