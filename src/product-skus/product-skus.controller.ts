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
import { ProductSkusService } from './product-skus.service';
import { CreateProductSkusDto } from './dto/create-product-skus.dto';
import { UpdateProductSkusDto } from './dto/update-product-skus.dto';

@ApiTags('product-skus')
@Controller('product-skus')
export class ProductSkusController {
  constructor(private readonly service: ProductSkusService) {}

  @Post()
  @ApiOperation({ summary: 'สร้าง SKU ให้กับสินค้า' })
  create(@Body() dto: CreateProductSkusDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'ดึงรายการ SKU ทั้งหมดหรือ filter ตาม productId' })
  @ApiQuery({
    name: 'productId',
    required: false,
    description: 'กรองตาม productId',
  })
  findAll(
    @Query('productId', new ParseIntPipe({ optional: true }))
    productId?: number,
  ) {
    return this.service.findAll(productId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึง SKU ตาม ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'แก้ไข SKU' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductSkusDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบ SKU' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
