import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductOptionValue } from './entities/product-option-value.entity';
import { CreateProductOptionValueDto } from './dto/create-product-option-value.dto';
import { UpdateProductOptionValueDto } from './dto/update-product-option-value.dto';
import { ProductOption } from 'src/product-options/entities/product-option.entity';

@Injectable()
export class ProductOptionValuesService {
  constructor(
    @InjectRepository(ProductOptionValue)
    private readonly valueRepo: Repository<ProductOptionValue>,

    @InjectRepository(ProductOption)
    private readonly optionRepo: Repository<ProductOption>,
  ) {}

  async create(dto: CreateProductOptionValueDto): Promise<ProductOptionValue> {
    const option = await this.optionRepo.findOne({
      where: { id: dto.productOptionId },
    });

    if (!option) {
      throw new NotFoundException('Product option not found');
    }

    const value = this.valueRepo.create({
      value: dto.value,
      valueCode: dto.valueCode,
      extraPrice:
        dto.extraPrice !== undefined ? dto.extraPrice.toString() : null,
      sortOrder: dto.sortOrder ?? 1,
      productOption: option,
    });

    return this.valueRepo.save(value);
  }

  async findAll(productOptionId?: number): Promise<ProductOptionValue[]> {
    const qb = this.valueRepo
      .createQueryBuilder('value')
      .leftJoinAndSelect('value.productOption', 'productOption')
      .orderBy('value.sortOrder', 'ASC');

    if (productOptionId) {
      // ใช้ชื่อคอลัมน์ใน DB ตรง ๆ
      qb.andWhere('value.product_option_id = :productOptionId', {
        productOptionId,
      });
    }

    return qb.getMany();
  }

  async findOne(id: number): Promise<ProductOptionValue> {
    const value = await this.valueRepo.findOne({
      where: { id },
      relations: ['productOption'],
    });

    if (!value) {
      throw new NotFoundException('Product option value not found');
    }

    return value;
  }

  async update(
    id: number,
    dto: UpdateProductOptionValueDto,
  ): Promise<ProductOptionValue> {
    const value = await this.findOne(id);

    if (dto.productOptionId) {
      const option = await this.optionRepo.findOne({
        where: { id: dto.productOptionId },
      });
      if (!option) {
        throw new NotFoundException('Product option not found');
      }
      value.productOption = option;
    }

    if (dto.value !== undefined) value.value = dto.value;
    if (dto.valueCode !== undefined) value.valueCode = dto.valueCode;
    if (dto.extraPrice !== undefined) {
      value.extraPrice = dto.extraPrice.toString();
    }
    if (dto.sortOrder !== undefined) value.sortOrder = dto.sortOrder;

    return this.valueRepo.save(value);
  }

  async remove(id: number) {
    const value = await this.findOne(id);
    await this.valueRepo.softRemove(value);
  }
}
