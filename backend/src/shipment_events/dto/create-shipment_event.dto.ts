import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class CreateShipmentEventDto {
  @ApiProperty({ description: 'id ของ shipment', example: 1, minimum: 1 })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  shipmentId: number;

  @ApiProperty({
    description: 'สถานะของการจัดส่ง ณ เวลานั้น',
    example: 'pending',
    enum: ['pending', 'paid', 'shipped', 'shipping', 'delivered', 'cancelled'],
    default: 'pending',
  })
  status: string;

  @ApiProperty({
    description: 'รายละเอียดของเหตุการณ์นั้นๆ',
    example: 'พัสดุถูกสร้างในระบบ',
  })
  desciption: string;

  @ApiProperty({
    description: 'ตำแหน่งที่เกิดเหตุการณ์นั้นๆของพัสดุ',
    example: 'สาขาบางนา',
  })
  location: string;
}
