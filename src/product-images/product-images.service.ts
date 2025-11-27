import { Injectable } from '@nestjs/common';
import { CreateProductImageDto } from './dto/create-product-image.dto';
import { UpdateProductImageDto } from './dto/update-product-image.dto';
import { ProductImage } from './entities/product-image.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from 'src/products/entities/product.entity';

@Injectable()
export class ProductImagesService {
  constructor(
    @InjectRepository(ProductImage)
    private readonly productImagesRepo: Repository<ProductImage>,
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
  ) {}

  async create(
    createProductImageDto: CreateProductImageDto & { imageUrl?: string },
  ): Promise<ProductImage> {
    const productImage = this.productImagesRepo.create({
      ...createProductImageDto,
    });
    productImage.product = await this.productsRepo.findOneByOrFail({
      id: createProductImageDto.productId,
    });
    return await this.productImagesRepo.save(productImage);
  }

  async findAll() {
    return await this.productImagesRepo.find({ relations: ['product'] });
  }

  async findOne(id: number) {
    return await this.productImagesRepo.findOneOrFail({
      where: { id },
      relations: ['product'],
    });
  }

  async update(
    id: number,
    updateProductImageDto: UpdateProductImageDto & { imageUrl?: string },
  ): Promise<ProductImage> {
    const productImage = this.productImagesRepo.create({
      ...updateProductImageDto,
    });
    await this.productImagesRepo.update(id, productImage);
    return await this.productImagesRepo.findOneOrFail({
      where: { id },
      relations: ['product'],
    });
  }

  async remove(id: number) {
    return await this.productImagesRepo.softDelete(id);
  }
}
