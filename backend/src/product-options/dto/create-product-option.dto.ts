import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateProductOptionDto {
  @ApiProperty({
    example: 12,
    description: 'ID ของสินค้า (FK -> product.id)',
  })
  @IsInt()
  @Min(1)
  productId: number;

  @ApiProperty({
    example: 'color',
    description: 'ชื่อภายในระบบ เช่น color, size',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'สี',
    description: 'ชื่อที่จะแสดงบนหน้าเว็บสำหรับผู้ใช้',
  })
  @IsString()
  @IsNotEmpty()
  displayName: string;

  @ApiProperty({
    example: 1,
    description: 'ลำดับการแสดง (น้อยกว่า = แสดงก่อน)',
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  sortOrder?: number = 1;

  @ApiProperty({
    example: true,
    description: 'กำหนดว่าเป็น option ที่ต้องเลือกหรือไม่',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean = false;
}
