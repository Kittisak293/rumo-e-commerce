import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateProductOptionDto {
  @IsInt()
  @Min(1)
  productId: number;

  @IsString()
  @IsNotEmpty()
  name: string; // "color", "size"

  @IsString()
  @IsNotEmpty()
  displayName: string; // "สี", "ไซต์"

  @IsInt()
  @Min(1)
  @IsOptional()
  sortOrder?: number = 1;

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean = false;
}
