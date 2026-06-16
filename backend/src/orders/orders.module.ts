import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { User } from 'src/users/entities/user.entity';
import { Address } from 'src/addresses/entities/address.entity';
import { OrderItem } from 'src/order_items/entities/order_item.entity';
import { Shipment } from 'src/shipments/entities/shipment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, User, Address, OrderItem, Shipment]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
