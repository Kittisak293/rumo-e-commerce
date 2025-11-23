import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ description: 'ชื่อหมวดหมู่', example: 'clothes' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'ส่วนท้ายของ URL ที่ใช้ระบุหมวดหมู่ในเว็บไซต์',
    example: 'mens-clothing',
  })
  @IsString()
  slug: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'รูปภาพ',
    required: false,
  })
  imageUrl: string;
}
