import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductOption } from './entities/product-option.entity';
import { CreateProductOptionDto } from './dto/create-product-option.dto';
import { UpdateProductOptionDto } from './dto/update-product-option.dto';
import { Product } from 'src/products/entities/product.entity';

@Injectable()
export class ProductOptionsService {
  constructor(
    @InjectRepository(ProductOption)
    private readonly productOptionRepo: Repository<ProductOption>,

    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async create(dto: CreateProductOptionDto): Promise<ProductOption> {
    const product = await this.productRepo.findOne({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const option = this.productOptionRepo.create({
      ...dto,
      product: product,
    });

    return this.productOptionRepo.save(option);
  }

  async findAll(productId?: number): Promise<ProductOption[]> {
    const qb = this.productOptionRepo
      .createQueryBuilder('option')
      .leftJoinAndSelect('option.product', 'product')
      .orderBy('option.sortOrder', 'ASC');

    if (productId) {
      qb.andWhere('option.product.id = :productId', { productId });
    }

    return qb.getMany();
  }

  async findOne(id: number): Promise<ProductOption> {
    const option = await this.productOptionRepo.findOne({
      where: { id },
      relations: ['product'],
    });

    if (!option) {
      throw new NotFoundException('Product option not found');
    }

    return option;
  }

  async update(
    id: number,
    dto: UpdateProductOptionDto,
  ): Promise<ProductOption> {
    const option = await this.findOne(id);

    // ถ้าให้แก้ productId ต้องเช็คว่า product ใหม่มีจริง
    if (dto.productId && dto.productId !== option.product.id) {
      const product = await this.productRepo.findOne({
        where: { id: dto.productId },
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }
      option.product = product;
    }

    Object.assign(option, dto);

    return this.productOptionRepo.save(option);
  }

  async remove(id: number) {
    const option = await this.findOne(id);
    await this.productOptionRepo.softDelete(id);
    return option;
  }
}
