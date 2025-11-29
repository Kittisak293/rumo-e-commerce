import { Module } from '@nestjs/common';
import { ProductOptionValuesService } from './product-option-values.service';
import { ProductOptionValuesController } from './product-option-values.controller';

@Module({
  controllers: [ProductOptionValuesController],
  providers: [ProductOptionValuesService],
})
export class ProductOptionValuesModule {}
