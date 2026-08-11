import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CreateIntentDto {
  @ApiProperty({
    description: 'ID ของออเดอร์ที่จะสร้าง PaymentIntent',
    example: 1,
  })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  orderId: number;
}
