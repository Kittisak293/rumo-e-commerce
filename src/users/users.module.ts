import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { CartItem } from 'src/cart-items/entities/cart-item.entity';
import { Order } from 'src/orders/entities/order.entity';
import { Address } from 'src/addresses/entities/address.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, CartItem, Order, Address])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
