import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class CreateProductOptionValueDto {
  @ApiProperty({
    description: 'รหัสของ product_option ที่ value นี้สังกัดอยู่',
    example: 1,
  })
  @IsInt()
  @Min(1)
  productOptionId: number;

  @ApiProperty({
    description: 'ค่าที่โชว์หน้าเว็บ เช่น "ดำ", "ขาว", "M", "L"',
    example: 'ดำ',
  })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiProperty({
    description: 'โค้ดภายใน เช่น "black", "white", "M", "L"',
    example: 'black',
  })
  @IsString()
  @IsNotEmpty()
  valueCode: string;

  @ApiProperty({
    description: 'ส่วนเพิ่ม/ลดราคา (+20, -10) ถ้าไม่ใส่ให้เป็น 0 หรือ null ได้',
    example: 20,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  extraPrice?: number;

  @ApiProperty({
    description: 'ลำดับการแสดง (1 = แสดงก่อน)',
    example: 1,
    required: false,
  })
  @IsInt()
  @IsOptional()
  @IsPositive()
  sortOrder?: number;
}
