import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
} from 'class-validator';

export class CreateCarrierDto {
  @ApiProperty({
    description: 'ชื่อเต็มของบริษัทขนส่ง',
    example: 'Kerry Express',
  })
  @IsNotEmpty()
  @IsString()
  @Length(2, 120)
  name: string;

  @ApiProperty({
    example: 'KERRY',
    description: 'รหัสย่อของบริษัทขนส่ง (ต้องไม่ซ้ำ)',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 32)
  code: string;

  @ApiProperty({
    example: 'https://th.kerryexpress.com',
    description: 'เว็บไซต์อย่างเป็นทางการของขนส่ง (ถ้ามี)',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'กรุณากรอก URL ให้ถูกต้อง' })
  website?: string;

  @ApiProperty({
    example: 'https://th.kerryexpress.com/track/?track={trackingNumber}',
    description:
      'ลิงก์ template สำหรับติดตามพัสดุ โดยใช้ {trackingNumber} แทนหมายเลขพัสดุ',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(5, 255)
  trackingUrlTemplate?: string;

  @ApiProperty({
    example: true,
    description: 'สถานะการใช้งาน (true = เปิดใช้งาน, false = ปิด)',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
