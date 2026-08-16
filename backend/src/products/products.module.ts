import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Category } from 'src/categories/entities/category.entity';
import { CartItem } from 'src/cart-items/entities/cart-item.entity';
import { OrderItem } from 'src/order_items/entities/order_item.entity';
import { ProductImage } from 'src/product-images/entities/product-image.entity';
import { ProductOption } from 'src/product-options/entities/product-option.entity';
import { ProductSku } from 'src/product-skus/entities/product-sku.entity';

import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Category,
      CartItem,
      OrderItem,
      ProductImage,
      ProductOption,
      ProductSku,
    ]),
    AuthModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
