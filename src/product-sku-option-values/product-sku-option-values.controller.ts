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
import { ProductSkuOptionValuesService } from './product-sku-option-values.service';
import { CreateProductSkuOptionValueDto } from './dto/create-product-sku-option-value.dto';
import { UpdateProductSkuOptionValueDto } from './dto/update-product-sku-option-value.dto';

@ApiTags('product-sku-option-values')
@Controller('product-sku-option-values')
export class ProductSkuOptionValuesController {
  constructor(private readonly service: ProductSkuOptionValuesService) {}

  @Post()
  @ApiOperation({ summary: 'สร้างลิงก์ระหว่าง SKU กับ option value' })
  create(@Body() dto: CreateProductSkuOptionValueDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'ดึงรายการทั้งหมดหรือกรองตาม SKU' })
  @ApiQuery({
    name: 'skuId',
    required: false,
    description: 'กรองด้วย SKU ID',
  })
  findAll(
    @Query('skuId', new ParseIntPipe({ optional: true }))
    skuId?: number,
  ) {
    return this.service.findAll(skuId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงข้อมูลตาม ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'อัพเดตข้อมูล' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductSkuOptionValueDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบข้อมูล' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
