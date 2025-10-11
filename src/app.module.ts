import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/entities/user.entity';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { CategoryModule } from './categories/categories.module';
import { Product } from './products/entities/product.entity';
import { Category } from './categories/entities/category.entity';
import { CartItemModule } from './cart-items/cart-items.module';
import { CartItem } from './cart-items/entities/cart-item.entity';
import { OrdersModule } from './orders/orders.module';
import { Order } from './orders/entities/order.entity';
import { AddressesModule } from './addresses/addresses.module';
import { Address } from './addresses/entities/address.entity';
import { OrderItemsModule } from './order_items/order_items.module';
import { OrderItem } from './order_items/entities/order_item.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'mydb.sqlite',
      entities: [User, Product, Category, CartItem, Order, Address, OrderItem],
      synchronize: true,
    }),
    UsersModule,
    AuthModule,
    ProductsModule,
    CategoryModule,
    CartItemModule,
    OrdersModule,
    AddressesModule,
    OrderItemsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
