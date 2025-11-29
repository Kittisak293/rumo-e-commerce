import { PartialType } from '@nestjs/swagger';
import { CreateProductSkuOptionDto } from './create-product-sku-option.dto';

export class UpdateProductSkuOptionDto extends PartialType(
  CreateProductSkuOptionDto,
) {}
