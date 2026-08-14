import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ShipmentStatus } from 'src/shipments/shipment-status.enum';

export class CreateShipmentEventDto {
  @ApiProperty({ description: 'id ของ shipment', example: 1, minimum: 1 })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  shipmentId: number;

  @ApiProperty({
    description: 'สถานะของการจัดส่ง ณ เวลานั้น',
    example: ShipmentStatus.IN_TRANSIT,
    enum: ShipmentStatus,
  })
  @IsEnum(ShipmentStatus)
  status: ShipmentStatus;

  @ApiProperty({
    description: 'รายละเอียดของเหตุการณ์นั้นๆ',
    example: 'พัสดุถูกสร้างในระบบ',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'ตำแหน่งที่เกิดเหตุการณ์นั้นๆของพัสดุ',
    example: 'สาขาบางนา',
    required: false,
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    description: 'เวลาที่เกิดเหตุการณ์ตามที่ขนส่งแจ้ง (ไม่ใส่ = เวลาปัจจุบัน)',
    example: '2026-08-11T18:24:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  occurredAt?: string;
}
