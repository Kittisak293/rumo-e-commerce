import { Module } from '@nestjs/common';
import { ProductSkusService } from './product-skus.service';
import { ProductSkusController } from './product-skus.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductSkus } from './entities/product-skus.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductSkus])],
  controllers: [ProductSkusController],
  providers: [ProductSkusService],
})
export class ProductSkusModule {}
