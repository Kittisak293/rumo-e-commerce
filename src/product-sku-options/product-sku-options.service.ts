import { Injectable } from '@nestjs/common';
import { CreateProductSkuOptionDto } from './dto/create-product-sku-option.dto';
import { UpdateProductSkuOptionDto } from './dto/update-product-sku-option.dto';

@Injectable()
export class ProductSkuOptionsService {
  create(createProductSkuOptionDto: CreateProductSkuOptionDto) {
    return 'This action adds a new productSkuOption';
  }

  findAll() {
    return `This action returns all productSkuOptions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} productSkuOption`;
  }

  update(id: number, updateProductSkuOptionDto: UpdateProductSkuOptionDto) {
    return `This action updates a #${id} productSkuOption`;
  }

  remove(id: number) {
    return `This action removes a #${id} productSkuOption`;
  }
}
