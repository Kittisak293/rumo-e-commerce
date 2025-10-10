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
  @ApiProperty()
  @IsInt()
  @IsPositive()
  userId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName: string;

  @ApiProperty({ description: 'เบอร์โทร เช่น 0812345678' })
  @IsString()
  @Length(8, 20)
  phone: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  province: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  district: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  subdistrict: string;

  @ApiProperty({ example: '20130' })
  @IsString()
  @Length(4, 10)
  postalCode: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean = false;
}
