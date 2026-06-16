import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class CreateProductSkuOptionValueDto {
  @ApiProperty({ example: 10, description: 'ID ของ product_sku' })
  @IsInt()
  @Min(1)
  productSkuId: number;

  @ApiProperty({
    example: 22,
    description: 'ID ของ product_option_value',
  })
  @IsInt()
  @Min(1)
  productOptionValueId: number;
}
