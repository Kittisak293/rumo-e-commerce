import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({
    description: 'ID ของผู้ใช้ที่ทำการสั่งซื้อ',
    example: 1,
  })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  userId: number;

  @ApiProperty({
    description: 'ID ของที่อยู่ผู้ซื้อ',
    example: 1,
  })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  addressId: number;

  @ApiProperty({
    description: 'สถานะของออเดอร์',
    example: 'pending',
    enum: ['pending', 'paid', 'shipped', 'shipping', 'delivered', 'cancelled'],
    default: 'pending',
  })
  status: string;

  @ApiProperty({
    description: 'ยอดรวมของสินค้าก่อนบวกค่าขนส่ง',
    example: 1500,
  })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiProperty({
    description: 'ค่าขนส่ง',
    example: 50,
  })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  shippingFee: number;

  @ApiProperty({
    description: 'จำนวนสินค้ารวมทั้งหมดในคำสั่งซื้อ',
    example: 3,
  })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  totalQuantity: number;

  @ApiProperty({
    description: 'ยอดรวมทั้งหมด (subtotal + shippingFee)',
    example: 1550,
  })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  total: number;

  @ApiProperty({
    description: 'หมายเลขคำสั่งซื้อ (เช่น ORD-20251012-0001)',
    example: 'ORD-20251012-0001',
  })
  @IsString()
  @IsOptional()
  orderNumber?: string;
}
