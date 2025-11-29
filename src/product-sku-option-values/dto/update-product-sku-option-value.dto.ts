import { PartialType } from '@nestjs/swagger';
import { CreateProductSkuOptionValueDto } from './create-product-sku-option-value.dto';

export class UpdateProductSkuOptionValueDto extends PartialType(
  CreateProductSkuOptionValueDto,
) {}
