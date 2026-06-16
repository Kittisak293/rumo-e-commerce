import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class CreateOrderItemDto {
  @ApiProperty({ description: 'id ของ order', example: 1, minimum: 1 })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  orderId: number;

  @ApiProperty({ description: 'id ของ order', example: 1, minimum: 1 })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  productId: number;

  @ApiProperty({ description: 'ราคาสินค้าต่อชิ้น', example: '1500' })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'จำนวนสินค้าที่สั่งซื้อ',
    example: '2',
  })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  quantity: number;
}
