import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  // IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
export class CreateUserDto {
  @ApiProperty({
    description: 'อีเมลสำหรับเข้าสู่ระบบ',
    example: 'user@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'ชื่อผู้ใช้',
    example: 'Kittisak',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'รหัสผ่าน (ต้องมีความยาว 8 ตัวอักษรขึ้นไป)',
    example: 'Kittisak123456789',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @Length(8, 32)
  password: string;

  // @ApiProperty({
  //   example: 'customer',
  //   description: 'บทบาทของผู้ใช้ (admin หรือ customer)',
  //   enum: ['admin', 'customer'],
  //   default: 'customer',
  //   required: false,
  // })
  // @IsOptional()
  // @IsEnum(['admin', 'customer'])
  // role?: 'admin' | 'customer';

  @ApiProperty({
    description: 'อายุ',
    example: 18,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  age?: number;
}
