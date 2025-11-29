import { Injectable } from '@nestjs/common';
import { CreateProductSkuOptionValueDto } from './dto/create-product-sku-option-value.dto';
import { UpdateProductSkuOptionValueDto } from './dto/update-product-sku-option-value.dto';

@Injectable()
export class ProductSkuOptionValuesService {
  create(createProductSkuOptionValueDto: CreateProductSkuOptionValueDto) {
    return 'This action adds a new productSkuOption';
  }

  findAll() {
    return `This action returns all productSkuOptions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} productSkuOption`;
  }

  update(
    id: number,
    updateProductSkuOptionValueDto: UpdateProductSkuOptionValueDto,
  ) {
    return `This action updates a #${id} productSkuOption`;
  }

  remove(id: number) {
    return `This action removes a #${id} productSkuOption`;
  }
}
