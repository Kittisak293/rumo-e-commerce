import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ProductSkuOptionsService } from './product-sku-options.service';
import { CreateProductSkuOptionDto } from './dto/create-product-sku-option.dto';
import { UpdateProductSkuOptionDto } from './dto/update-product-sku-option.dto';

@Controller('product-sku-options')
export class ProductSkuOptionsController {
  constructor(
    private readonly productSkuOptionsService: ProductSkuOptionsService,
  ) {}

  @Post()
  create(@Body() createProductSkuOptionDto: CreateProductSkuOptionDto) {
    return this.productSkuOptionsService.create(createProductSkuOptionDto);
  }

  @Get()
  findAll() {
    return this.productSkuOptionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productSkuOptionsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductSkuOptionDto: UpdateProductSkuOptionDto,
  ) {
    return this.productSkuOptionsService.update(+id, updateProductSkuOptionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productSkuOptionsService.remove(+id);
  }
}
