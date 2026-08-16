import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { User } from 'src/users/entities/user.entity';
import { Address } from 'src/addresses/entities/address.entity';
import { OrderItem } from 'src/order_items/entities/order_item.entity';
import { Shipment } from 'src/shipments/entities/shipment.entity';
import { CartItem } from 'src/cart-items/entities/cart-item.entity';
import { Product } from 'src/products/entities/product.entity';
import { AuthModule } from 'src/auth/auth.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      User,
      Address,
      OrderItem,
      Shipment,
      CartItem,
      Product,
    ]),
    AuthModule,
    NotificationsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
