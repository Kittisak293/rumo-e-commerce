import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
} from 'class-validator';
export class CreateUserDto {
    @ApiProperty({
    description: 'อีเมลสำหรับเข้าสู่ระบบ',
    example: 'user@example.com',
  })
  @IsEmail()
}
