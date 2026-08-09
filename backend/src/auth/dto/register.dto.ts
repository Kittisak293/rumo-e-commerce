import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

/**
 * Deliberately not reusing CreateUserDto, which carries admin-only fields the
 * signup form has no business accepting. Mirrors the fields the auth UI
 * collects: name (first + last joined by the client), email, password.
 */
export class RegisterDto {
  @ApiProperty({ description: 'อีเมลสำหรับเข้าสู่ระบบ', example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'ชื่อผู้ใช้', example: 'Kittisak' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'รหัสผ่าน (8 ตัวอักษรขึ้นไป)',
    example: 'Kittisak123456789',
    minLength: 8,
  })
  @IsString()
  @Length(8, 32)
  password: string;
}
