import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Category } from 'src/categories/entities/category.entity';
import { CartItem } from 'src/cart-items/entities/cart-item.entity';
import { OrderItem } from 'src/order_items/entities/order_item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Category, CartItem, OrderItem])],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
