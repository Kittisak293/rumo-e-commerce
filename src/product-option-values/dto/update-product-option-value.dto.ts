import { PartialType } from '@nestjs/swagger';
import { CreateProductOptionValueDto } from './create-product-option-value.dto';

export class UpdateProductOptionValueDto extends PartialType(CreateProductOptionValueDto) {}
