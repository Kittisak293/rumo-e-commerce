import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateShipmentDto {
  @ApiProperty({ example: 1, description: 'ID ของออเดอร์' })
  @IsInt()
  orderId: number;

  @ApiProperty({ example: 2, description: 'ID ของบริษัทขนส่ง' })
  @IsInt()
  carrierId: number;

  @ApiProperty({ example: 'TH1234567890', description: 'หมายเลขพัสดุ' })
  @IsString()
  trackingNumber: string;

  @ApiProperty({ example: 'in_transit', description: 'สถานะการจัดส่ง' })
  @IsString()
  status: string;

  @ApiProperty({
    example: 'Bangkok Distribution Center',
    description: 'สถานที่ล่าสุดของพัสดุ',
    required: false,
  })
  @IsOptional()
  @IsString()
  lastLocation?: string;

  @ApiProperty({
    example: '2025-10-20T18:00:00Z',
    description: 'วันที่คาดว่าจะจัดส่งถึง',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  estimatedDeliveryAt?: string;
}
