import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ProductSkuOptionValuesService } from './product-sku-option-values.service';
import { CreateProductSkuOptionValueDto } from './dto/create-product-sku-option-value.dto';
import { UpdateProductSkuOptionValueDto } from './dto/update-product-sku-option-value.dto';

@Controller('product-sku-options')
export class ProductSkuOptionValuesController {
  constructor(
    private readonly productSkuOptionValuesService: ProductSkuOptionValuesService,
  ) {}

  @Post()
  create(
    @Body() createProductSkuOptionValueDto: CreateProductSkuOptionValueDto,
  ) {
    return this.productSkuOptionValuesService.create(
      createProductSkuOptionValueDto,
    );
  }

  @Get()
  findAll() {
    return this.productSkuOptionValuesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productSkuOptionValuesService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductSkuOptionValueDto: UpdateProductSkuOptionValueDto,
  ) {
    return this.productSkuOptionValuesService.update(
      +id,
      updateProductSkuOptionValueDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productSkuOptionValuesService.remove(+id);
  }
}
