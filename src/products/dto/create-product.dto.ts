import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ description: 'ชื่อสินค้า', example: 'Gaming Mouse ZXY' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'รายละเอียดสิค้า',
    example:
      'เมาส์เกมมิ่ง สามารถเชื่อมต่อได้ทั้ง Bluetooth และ USB สามารถใช้ได้ทั้ง Windows, macOS และ Linux',
  })
  description: string;

  @ApiProperty({ description: 'ราคาสินค้า', example: 1590, minimum: 0 })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'จำนวนสินค้าในคลัง', example: 62, minimum: 0 })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiProperty({ description: 'id ของ category', example: 1, minimum: 1 })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  categoryId: number;
}
