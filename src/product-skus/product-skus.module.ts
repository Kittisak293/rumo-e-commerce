import { Module } from '@nestjs/common';
import { ProductSkusService } from './product-skus.service';
import { ProductSkusController } from './product-skus.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductSku } from './entities/product-skus.entity';
import { Product } from 'src/products/entities/product.entity';
import { ProductSkuOptionValue } from 'src/product-sku-option-values/entities/product-sku-option-value.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductSku, Product, ProductSkuOptionValue]),
  ],
  controllers: [ProductSkusController],
  providers: [ProductSkusService],
})
export class ProductSkusModule {}
