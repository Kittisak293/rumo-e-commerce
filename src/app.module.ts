import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/entities/user.entity';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { CategoryModule } from './category/category.module';
import { Product } from './products/entities/product.entity';
import { Category } from './category/entities/category.entity';
import { CartItemModule } from './cart-item/cart-item.module';
import { CartItem } from './cart-item/entities/cart-item.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'mydb.sqlite',
      entities: [User, Product, Category, CartItem],
      synchronize: true,
    }),
    UsersModule,
    AuthModule,
    ProductsModule,
    CategoryModule,
    CartItemModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
