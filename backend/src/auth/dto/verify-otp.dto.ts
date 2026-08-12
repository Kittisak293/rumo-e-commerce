import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    description: 'The short-lived token returned by POST /auth/login',
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
}
