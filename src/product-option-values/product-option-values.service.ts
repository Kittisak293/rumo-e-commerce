import { Injectable } from '@nestjs/common';
import { CreateProductOptionValueDto } from './dto/create-product-option-value.dto';
import { UpdateProductOptionValueDto } from './dto/update-product-option-value.dto';

@Injectable()
export class ProductOptionValuesService {
  create(createProductOptionValueDto: CreateProductOptionValueDto) {
    return 'This action adds a new productOptionValue';
  }

  findAll() {
    return `This action returns all productOptionValues`;
  }

  findOne(id: number) {
    return `This action returns a #${id} productOptionValue`;
  }

  update(id: number, updateProductOptionValueDto: UpdateProductOptionValueDto) {
    return `This action updates a #${id} productOptionValue`;
  }

  remove(id: number) {
    return `This action removes a #${id} productOptionValue`;
  }
}
