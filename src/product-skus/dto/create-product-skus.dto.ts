import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateProductSkusDto {
  @ApiProperty({
    example: 12,
    description: 'ID ของ product แม่',
  })
  @IsInt()
  @Min(1)
  productId: number;

  @ApiProperty({
    example: 'TSHIRT-BLACK-M',
    description: 'รหัส SKU จริงที่ใช้ใน warehouse / logistics',
  })
  @IsString()
  @IsNotEmpty()
  skuCode: string;

  @ApiProperty({
    example: '8857123456678',
    description: 'บาร์โค้ดของสินค้า (optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiProperty({
    example: 199,
    description: 'ราคาปัจจุบันของ SKU',
  })
  @IsNumber()
  price: number;

  @ApiProperty({
    example: 250,
    description: 'ราคาก่อนลด (optional)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  compareAtPrice?: number;

  @ApiProperty({
    example: 120,
    description: 'จำนวน stock',
  })
  @IsInt()
  stockQty: number;

  @ApiProperty({
    example: 0.35,
    description: 'น้ำหนักของ SKU (kg หรือ g แล้วแต่ระบบ)',
  })
  @IsNumber()
  weight: number;

  @ApiProperty({
    example: 'https://rumo.com/skus/123.jpg',
    description: 'รูปภาพเฉพาะของ SKU (optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({
    example: true,
    description: 'สถานะสินค้าใช้งานอยู่หรือไม่',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
