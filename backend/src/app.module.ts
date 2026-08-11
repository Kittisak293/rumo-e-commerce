import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
import { createHash } from 'crypto';
import { ThrottlerModule } from '@nestjs/throttler';
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
import { NotificationsModule } from './notifications/notifications.module';
import { Notification } from './notifications/entities/notification.entity';
import { PaymentsModule } from './payments/payments.module';
import { ProcessedEvent } from './stripe/processed-event.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Config only — ThrottlerGuard is applied per-route on the auth endpoints,
    // not registered globally, so the other feature modules are untouched.
    //
    // This is defence in depth. The durable limits are the Redis cooldown and
    // lockout keys in OtpService; this store is in-memory and resets on restart.
    ThrottlerModule.forRoot([
      // Blunt instrument against a single noisy host.
      { name: 'ip', ttl: 60_000, limit: 20 },
      // The one that actually protects a targeted account.
      {
        name: 'email',
        ttl: 60_000,
        limit: 5,
        getTracker: (req: Record<string, any>): Promise<string> => {
          // Guards run after body parsing but BEFORE ValidationPipe, so this is
          // wholly unvalidated input — it could be an object, or 10MB of text.
          // Hence the typeof check and the length cap.
          const body = (req.body ?? {}) as { email?: unknown };
          const email =
            typeof body.email === 'string'
              ? body.email.trim().toLowerCase().slice(0, 254)
              : '';
          const ip: unknown =
            Array.isArray(req.ips) && req.ips.length ? req.ips[0] : req.ip;
          return Promise.resolve(
            email
              ? `em:${createHash('sha256').update(email).digest('hex')}`
              : `ip:${String(ip)}`,
          );
        },
      },
    ]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      // POSTGRES_DB_HOST/PORT so a future move to a managed provider (Neon,
      // Supabase, Railway) is just an env change — see POSTGRES_DB_SSL below.
      host: process.env.POSTGRES_DB_HOST || 'localhost',
      port: Number(process.env.POSTGRES_DB_PORT) || 5432,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      ssl:
        process.env.POSTGRES_DB_SSL === 'true'
          ? { rejectUnauthorized: false }
          : false,
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
        Notification,
        ProcessedEvent,
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
    NotificationsModule,
    PaymentsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
