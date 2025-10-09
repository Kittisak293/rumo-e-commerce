import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Category } from 'src/category/entities/category.entity';
import { CartItem } from 'src/cart-item/entities/cart-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Category, CartItem])],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
