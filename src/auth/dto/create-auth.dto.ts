import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class SignInDto {
  @ApiProperty({ example: '1' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456789' })
  @IsNotEmpty()
  password: string;
}
