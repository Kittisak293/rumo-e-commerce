import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    description: 'The otpToken returned by POST /auth/forgot-password',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  otpToken: string;

  @ApiProperty({
    description: 'The 6-digit code from the email',
    example: '042917',
  })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'code must be 6 digits' })
  code: string;

  @ApiProperty({
    description: 'รหัสผ่านใหม่',
    example: 'NewPassword12345',
    minLength: 8,
  })
  @IsString()
  @Length(8, 32)
  newPassword: string;
}
