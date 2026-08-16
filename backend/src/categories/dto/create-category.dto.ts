import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ description: 'ชื่อหมวดหมู่', example: 'clothes' })
  @IsString()
  name: string;

  // Server-generated from `name` on create (see CategoryService.create) and
  // frozen after that — never accepted from the client on update. Optional
  // here only so a bare `{ name }` payload still passes ValidationPipe.
  @ApiProperty({
    description:
      'ส่วนท้ายของ URL ที่ใช้ระบุหมวดหมู่ในเว็บไซต์ (ระบบสร้างให้อัตโนมัติ)',
    example: 'mens-clothing',
    required: false,
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'รูปภาพ',
    required: false,
  })
  imageUrl: string;
}
