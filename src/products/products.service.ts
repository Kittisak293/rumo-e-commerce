import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { Category } from 'src/categories/entities/category.entity';
import { StoreType } from 'src/common/enums/store-type.enum';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    const product = this.productsRepository.create(createProductDto);
    const category = await this.categoriesRepository.findOneByOrFail({
      id: createProductDto.categoryId,
    });
    product.category = category;
    product.ratingAvg = 0;
    product.ratingCount = 0;
    product.soldCount = 0;
    return await this.productsRepository.save(product);
  }

  async findAll() {
    return await this.productsRepository.find();
  }

  async findOne(id: number) {
    return await this.productsRepository.findOne({ where: { id: id } });
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const product = this.productsRepository.create(updateProductDto);
    const category = await this.categoriesRepository.findOneByOrFail({
      id: updateProductDto.categoryId,
    });
    product.category = category;
    await this.productsRepository.update(id, product);
    return await this.productsRepository.findOne({ where: { id: id } });
  }

  async remove(id: number) {
    const product = await this.productsRepository.findOne({
      where: { id: id },
    });
    await this.productsRepository.softDelete(id);
    return product;
  }

  async findMallProducts() {
    return await this.productsRepository.find({
      where: { storeType: StoreType.MALL },
    });
  }
}
