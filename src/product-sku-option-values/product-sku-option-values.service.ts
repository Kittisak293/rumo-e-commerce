import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductSkuOptionValue } from './entities/product-sku-option-value.entity';
import { ProductSku } from 'src/product-skus/entities/product-sku.entity';
import { ProductOptionValue } from 'src/product-option-values/entities/product-option-value.entity';
import { CreateProductSkuOptionValueDto } from './dto/create-product-sku-option-value.dto';
import { UpdateProductSkuOptionValueDto } from './dto/update-product-sku-option-value.dto';

@Injectable()
export class ProductSkuOptionValuesService {
  constructor(
    @InjectRepository(ProductSkuOptionValue)
    private readonly repo: Repository<ProductSkuOptionValue>,
    @InjectRepository(ProductSku)
    private readonly skuRepo: Repository<ProductSku>,
    @InjectRepository(ProductOptionValue)
    private readonly optionValueRepo: Repository<ProductOptionValue>,
  ) {}

  async create(dto: CreateProductSkuOptionValueDto) {
    const sku = await this.skuRepo.findOne({
      where: { id: dto.productSkuId },
    });
    if (!sku) throw new NotFoundException('SKU not found');

    const optionValue = await this.optionValueRepo.findOne({
      where: { id: dto.productOptionValueId },
    });
    if (!optionValue) throw new NotFoundException('Option value not found');

    const item = this.repo.create({
      productSku: sku,
      productOptionValue: optionValue,
    });

    return this.repo.save(item);
  }

  async findAll(skuId?: number) {
    const qb = this.repo
      .createQueryBuilder('psov')
      .leftJoinAndSelect('psov.productSku', 'sku')
      .leftJoinAndSelect('psov.productOptionValue', 'value');

    if (skuId) {
      qb.where('psov.product_sku_id = :skuId', { skuId });
    }

    return qb.getMany();
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({
      where: { id },
      relations: ['productSku', 'productOptionValue'],
    });

    if (!item) throw new NotFoundException('Record not found');
    return item;
  }

  async update(id: number, dto: UpdateProductSkuOptionValueDto) {
    const item = await this.findOne(id);

    if (dto.productSkuId) {
      const sku = await this.skuRepo.findOne({
        where: { id: dto.productSkuId },
      });
      if (!sku) throw new NotFoundException('SKU not found');
      item.productSku = sku;
    }

    if (dto.productOptionValueId) {
      const val = await this.optionValueRepo.findOne({
        where: { id: dto.productOptionValueId },
      });
      if (!val) throw new NotFoundException('Option value not found');
      item.productOptionValue = val;
    }

    return this.repo.save(item);
  }

  async remove(id: number) {
    await this.repo.delete(id);
    return { message: 'Deleted' };
  }
}
