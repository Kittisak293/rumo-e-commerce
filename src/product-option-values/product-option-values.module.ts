import { Module } from '@nestjs/common';
import { ProductOptionValuesService } from './product-option-values.service';
import { ProductOptionValuesController } from './product-option-values.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductOptionValue } from './entities/product-option-value.entity';
import { ProductOption } from 'src/product-options/entities/product-option.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductOptionValue, ProductOption])],
  controllers: [ProductOptionValuesController],
  providers: [ProductOptionValuesService],
})
export class ProductOptionValuesModule {}
