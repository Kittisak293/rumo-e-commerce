import { Injectable } from '@nestjs/common';
import { CreateProductImageDto } from './dto/create-product-image.dto';
import { UpdateProductImageDto } from './dto/update-product-image.dto';
import { ProductImage } from './entities/product-image.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ProductImagesService {
  constructor(
    @InjectRepository(ProductImage)
    private readonly productImagesRepo: Repository<ProductImage>,
  ) {}

  async create(
    createProductImageDto: CreateProductImageDto & { imageUrl: string },
  ): Promise<ProductImage> {
    const productImage = this.productImagesRepo.create({
      ...createProductImageDto,
    });
    return await this.productImagesRepo.save(productImage);
  }

  async findAll() {
    return await this.productImagesRepo.find();
  }

  async findOne(id: number) {
    return await this.productImagesRepo.findOneByOrFail({ id });
  }

  async update(
    id: number,
    updateProductImageDto: UpdateProductImageDto & { imageUrl: string },
  ): Promise<ProductImage> {
    const productImage = this.productImagesRepo.create({
      ...updateProductImageDto,
    });
    await this.productImagesRepo.update(id, productImage);
    return await this.productImagesRepo.findOneOrFail({ where: { id: id } });
  }

  async remove(id: number) {
    return await this.productImagesRepo.softDelete(id);
  }
}
