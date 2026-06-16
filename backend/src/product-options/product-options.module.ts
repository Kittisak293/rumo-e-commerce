import { Module } from '@nestjs/common';
import { ProductOptionsService } from './product-options.service';
import { ProductOptionsController } from './product-options.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductOption } from './entities/product-option.entity';
import { Product } from 'src/products/entities/product.entity';
import { ProductOptionValue } from 'src/product-option-values/entities/product-option-value.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductOption, Product, ProductOptionValue]),
  ],
  controllers: [ProductOptionsController],
  providers: [ProductOptionsService],
})
export class ProductOptionsModule {}
