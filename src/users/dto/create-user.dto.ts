import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, Length } from 'class-validator';
import { Transform } from 'class-transformer';
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
  username: string;

  @ApiProperty({
    description: 'รหัสผ่าน (ต้องมีความยาว 8-32 ตัวอักษร)',
    example: 'Kittisak123456789',
    minLength: 8,
    maxLength: 32,
  })
  @IsNotEmpty()
  @Length(8, 32)
  password: string;

  @ApiProperty({
    description: 'ชุด id ของ ผู้ใช้',
    example: [1, 2],
  })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty()
  roleIds: number;
}
