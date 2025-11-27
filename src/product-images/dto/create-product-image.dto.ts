import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class CreateProductImageDto {
  @ApiProperty({ description: 'id ของ product', example: 1, minimum: 1 })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  productId: number;

  @ApiProperty({ description: 'ลำดับของรูปภาพ 1 2 3', example: 1 })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  index: number;
}
