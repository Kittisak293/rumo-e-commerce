import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProductOptionValuesService } from './product-option-values.service';
import { CreateProductOptionValueDto } from './dto/create-product-option-value.dto';
import { UpdateProductOptionValueDto } from './dto/update-product-option-value.dto';

@Controller('product-option-values')
export class ProductOptionValuesController {
  constructor(private readonly productOptionValuesService: ProductOptionValuesService) {}

  @Post()
  create(@Body() createProductOptionValueDto: CreateProductOptionValueDto) {
    return this.productOptionValuesService.create(createProductOptionValueDto);
  }

  @Get()
  findAll() {
    return this.productOptionValuesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productOptionValuesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductOptionValueDto: UpdateProductOptionValueDto) {
    return this.productOptionValuesService.update(+id, updateProductOptionValueDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productOptionValuesService.remove(+id);
  }
}
