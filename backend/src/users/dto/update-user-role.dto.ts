import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class UpdateUserRoleDto {
  @ApiProperty({
    example: 'admin',
    description: 'บทบาทใหม่ของผู้ใช้',
    enum: ['admin', 'customer'],
  })
  @IsEnum(['admin', 'customer'])
  role: 'admin' | 'customer';
}
