import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({ description: 'ID ของผู้ใช้', example: 1 })
  @IsInt()
  @IsPositive()
  userId: number;

  @ApiProperty({
    description: 'ชื่อ-นามสกุลของผู้ใช้',
    example: 'Kittisak Janwanrak',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName: string;

  @ApiProperty({ description: 'เบอร์โทร', example: '0942295614' })
  @IsString()
  @Length(8, 20)
  phone: string;

  @ApiProperty({ description: 'จังหวัด', example: 'ตราด' })
  @IsString()
  @MaxLength(100)
  province: string;

  @ApiProperty({ description: 'อำเภอ', example: 'บ่อไร่' })
  @IsString()
  @MaxLength(100)
  district: string;

  @ApiProperty({ description: 'ตำบล', example: 'บ่อพลอย' })
  @IsString()
  @MaxLength(100)
  subdistrict: string;

  @ApiProperty({ description: 'รหัสไปรษณีย์', example: '23140' })
  @IsString()
  @Length(4, 10)
  postalCode: string;

  @ApiPropertyOptional({
    description: 'ตั้งเป็นที่อยู่เริ่มต้น',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean = false;
}
