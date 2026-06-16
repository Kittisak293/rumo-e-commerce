import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProductOptionValuesService } from './product-option-values.service';
import { CreateProductOptionValueDto } from './dto/create-product-option-value.dto';
import { UpdateProductOptionValueDto } from './dto/update-product-option-value.dto';

@ApiTags('product-option-values')
@Controller('product-option-values')
export class ProductOptionValuesController {
  constructor(
    private readonly productOptionValuesService: ProductOptionValuesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'สร้าง option value ให้กับ product option' })
  create(@Body() dto: CreateProductOptionValueDto) {
    return this.productOptionValuesService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'ดึงรายการ option value ทั้งหมด หรือ filter ตาม productOptionId',
  })
  @ApiQuery({
    name: 'productOptionId',
    required: false,
    description: 'ถ้าส่งมาจะดึงเฉพาะของ option นี้',
    example: 1,
  })
  findAll(
    @Query('productOptionId', new ParseIntPipe({ optional: true }))
    productOptionId?: number,
  ) {
    return this.productOptionValuesService.findAll(productOptionId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงรายละเอียด option value ตาม id' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productOptionValuesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'แก้ไข option value ตาม id' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductOptionValueDto,
  ) {
    return this.productOptionValuesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบ option value ตาม id' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productOptionValuesService.remove(id);
  }
}
