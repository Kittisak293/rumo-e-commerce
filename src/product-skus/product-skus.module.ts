import { Module } from '@nestjs/common';
import { ProductSkusService } from './product-skus.service';
import { ProductSkusController } from './product-skus.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductSkus } from './entities/product-skus.entity';
import { Product } from 'src/products/entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductSkus, Product])],
  controllers: [ProductSkusController],
  providers: [ProductSkusService],
})
export class ProductSkusModule {}
