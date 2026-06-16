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
import { ShipmentsModule } from './shipments/shipments.module';
import { ShipmentEventsModule } from './shipment_events/shipment_events.module';
import { Shipment } from './shipments/entities/shipment.entity';
import { ShipmentEvent } from './shipment_events/entities/shipment_event.entity';
import { CarriersModule } from './carriers/carriers.module';
import { Carrier } from './carriers/entities/carrier.entity';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ProductImagesModule } from './product-images/product-images.module';
import { ProductImage } from './product-images/entities/product-image.entity';
import { ProductOptionsModule } from './product-options/product-options.module';
import { ProductOption } from './product-options/entities/product-option.entity';
import { ProductOptionValuesModule } from './product-option-values/product-option-values.module';
import { ProductOptionValue } from './product-option-values/entities/product-option-value.entity';
import { ProductSkusModule } from './product-skus/product-skus.module';
import { ProductSku } from './product-skus/entities/product-sku.entity';
import { ProductSkuOptionValuesModule } from './product-sku-option-values/product-sku-option-values.module';
import { ProductSkuOptionValue } from './product-sku-option-values/entities/product-sku-option-value.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'mydb.sqlite',
      entities: [
        User,
        Product,
        Category,
        CartItem,
        Order,
        Address,
        OrderItem,
        Shipment,
        ShipmentEvent,
        Carrier,
        ProductImage,
        ProductOption,
        ProductOptionValue,
        ProductSku,
        ProductSkuOptionValue,
      ],
      synchronize: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads/products'),
      serveRoot: '/static-images',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads/categories'),
      serveRoot: '/category-images',
    }),
    UsersModule,
    AuthModule,
    ProductsModule,
    CategoryModule,
    CartItemModule,
    OrdersModule,
    AddressesModule,
    OrderItemsModule,
    ShipmentsModule,
    ShipmentEventsModule,
    CarriersModule,
    ProductImagesModule,
    ProductOptionsModule,
    ProductOptionValuesModule,
    ProductSkusModule,
    ProductSkuOptionValuesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
