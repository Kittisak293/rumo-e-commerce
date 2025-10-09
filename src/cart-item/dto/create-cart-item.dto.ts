import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class CreateCartItemDto {
  @ApiProperty({
    description: 'จำนวนสินค้าที่เพิ่มเข้าตะกร้า',
    example: 2,
    minimum: 1,
  })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'ราคาต่อหน่วยของสินค้า (ณ ตอนเพิ่มลงตะกร้า)',
    example: 1590.0,
  })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'ID ของสินค้า',
    example: 1,
  })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  productId: number;

  @ApiProperty({
    description: 'ID ของผู้ใช้',
    example: 1,
  })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  userId: number;
}
